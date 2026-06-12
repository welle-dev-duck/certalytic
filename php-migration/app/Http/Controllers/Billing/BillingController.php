<?php

namespace App\Http\Controllers\Billing;

use App\Enums\Plan;
use App\Enums\TeamRole;
use App\Http\Controllers\Controller;
use App\Models\Team;
use App\Services\PlanFeatures;
use App\Services\TokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Cashier\Checkout;
use Laravel\Cashier\Exceptions\IncompletePayment;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class BillingController extends Controller
{
    public function index(Team $current_team, TokenService $tokenService, PlanFeatures $planFeatures): Response
    {
        $this->ensureOwner($current_team);

        $plan = $planFeatures->plan($current_team);

        return Inertia::render('billing/index', [
            'tokenUsage' => $tokenService->usageSummary($current_team),
            'currentPlan' => [
                'value' => $plan->value,
                'label' => $plan->label(),
                'price' => $plan->config()['price'],
            ],
            'plans' => collect([Plan::Starter, Plan::Growth, Plan::Scale])->map(fn (Plan $p) => [
                'value' => $p->value,
                'label' => $p->label(),
                'price' => $p->config()['price'],
                'tokens' => $p->includedTokens(),
                'seats' => $p->maxSeats(),
                'features' => $p->billingFeatures(),
                'incremental_features' => $p->incrementalBillingFeatures(),
                'includes_plan' => $p->previousPlan()?->label(),
            ])->values(),
            'enterprisePlan' => [
                'label' => Plan::Enterprise->label(),
                'features' => [
                    'Everything in Scale, plus:',
                    'ATS system integrations (Greenhouse, Lever, Workday)',
                    'Single sign-on (SSO) & SAML',
                    'Priority support with dedicated success manager',
                    'Custom onboarding',
                    'API access',
                ],
            ],
            'contactEmail' => config('mail.from.address', 'hello@example.com'),
            'freePlanFeatures' => Plan::Free->billingFeatures(),
            'tokenPacks' => collect(config('certalytic.token_packs'))->map(fn ($pack, $key) => [
                'key' => $key,
                'name' => $pack['name'],
                'tokens' => $pack['tokens'],
                'price' => $pack['price'],
            ])->values(),
            'canPurchasePacks' => $planFeatures->can($current_team, 'token_packs'),
            'hasIncompletePayment' => $current_team->hasIncompletePayment('default'),
            'paymentMethod' => [
                'type' => $current_team->pm_type,
                'last_four' => $current_team->pm_last_four,
            ],
        ]);
    }

    public function subscribe(Request $request, Team $current_team, PlanFeatures $planFeatures): RedirectResponse|SymfonyResponse
    {
        $this->ensureOwner($current_team);

        $plan = Plan::from($request->string('plan')->toString());
        $priceId = $plan->stripePriceId();

        if ($priceId === null) {
            return back()->withErrors(['plan' => 'This plan is not available for self-serve checkout.']);
        }

        try {
            if ($current_team->subscribed('default')) {
                $current_team->subscription('default')->swap($priceId);

                $current_team->update(['plan' => $plan]);

                return redirect()->route('billing.index', $current_team);
            }

            $checkout = $current_team
                ->newSubscription('default', $priceId)
                ->checkout([
                    'success_url' => route('billing.index', $current_team).'?checkout=success',
                    'cancel_url' => route('billing.index', $current_team).'?checkout=cancelled',
                ]);

            return $this->redirectToStripe($checkout);
        } catch (IncompletePayment $exception) {
            return redirect()->route('cashier.payment', [
                $exception->payment->id,
                'redirect' => route('billing.index', $current_team),
            ]);
        }
    }

    public function portal(Team $current_team): RedirectResponse|SymfonyResponse
    {
        $this->ensureOwner($current_team);

        return Inertia::location($current_team->billingPortalUrl(route('billing.index', $current_team)));
    }

    public function purchasePack(Request $request, Team $current_team, PlanFeatures $planFeatures): RedirectResponse|SymfonyResponse
    {
        $this->ensureOwner($current_team);

        if (! $planFeatures->can($current_team, 'token_packs')) {
            return back()->withErrors(['pack' => 'Token packs require a paid plan.']);
        }

        $packKey = $request->string('pack')->toString();
        $pack = config('certalytic.token_packs.'.$packKey);
        $priceId = $pack['stripe_price'] ?? null;

        if ($pack === null || $priceId === null) {
            return back()->withErrors(['pack' => 'Invalid token pack selected.']);
        }

        $checkout = $current_team->checkout([$priceId], [
            'success_url' => route('billing.packs.success', $current_team).'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('billing.index', $current_team),
            'metadata' => [
                'team_id' => (string) $current_team->id,
                'pack' => $packKey,
            ],
        ]);

        return $this->redirectToStripe($checkout);
    }

    public function packSuccess(Request $request, Team $current_team, TokenService $tokenService): RedirectResponse
    {
        $this->ensureOwner($current_team);

        $sessionId = $request->string('session_id')->toString();

        if ($sessionId !== '') {
            $session = $current_team->stripe()->checkout->sessions->retrieve($sessionId);
            $metadata = $session->metadata?->toArray() ?? [];
            $packKey = $metadata['pack'] ?? null;
            $teamId = $metadata['team_id'] ?? null;

            if ($teamId === (string) $current_team->id && is_string($packKey)) {
                $pack = config('certalytic.token_packs.'.$packKey);

                if ($pack) {
                    $tokenService->creditPack($current_team, $pack['tokens'], $sessionId);
                }
            }
        }

        return redirect()
            ->route('billing.index', $current_team)
            ->with('success', 'Token pack purchased successfully.');
    }

    private function redirectToStripe(Checkout $checkout): RedirectResponse|SymfonyResponse
    {
        return Inertia::location($checkout->url);
    }

    private function ensureOwner(Team $team): void
    {
        $user = request()->user();

        abort_unless(
            $user && $team->members()->where('user_id', $user->id)->wherePivot('role', TeamRole::Owner->value)->exists(),
            403,
        );
    }
}
