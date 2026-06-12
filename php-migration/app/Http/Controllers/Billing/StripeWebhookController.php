<?php

namespace App\Http\Controllers\Billing;

use App\Enums\Plan;
use App\Models\Team;
use App\Services\TokenService;
use App\Services\TranscriptTokenService;
use Laravel\Cashier\Http\Controllers\WebhookController as CashierWebhookController;
use Symfony\Component\HttpFoundation\Response;

class StripeWebhookController extends CashierWebhookController
{
    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleCheckoutSessionCompleted(array $payload): Response
    {
        $session = $payload['data']['object'];
        $metadata = $session['metadata'] ?? [];
        $teamId = $metadata['team_id'] ?? null;
        $packKey = $metadata['pack'] ?? null;
        $transcriptPack = $metadata['transcript_pack'] ?? null;

        if ($teamId && $packKey && ($session['mode'] ?? null) === 'payment') {
            $team = Team::find($teamId);
            $pack = config('certalytic.token_packs.'.$packKey);

            if ($team && $pack) {
                app(TokenService::class)->creditPack(
                    $team,
                    $pack['tokens'],
                    $session['id'] ?? null,
                );
            }
        }

        if ($teamId && $transcriptPack === 'single' && ($session['mode'] ?? null) === 'payment') {
            $team = Team::find($teamId);

            if ($team) {
                app(TranscriptTokenService::class)->credit(
                    $team,
                    config('certalytic.transcription_pack.tokens'),
                    $session['id'] ?? null,
                );
            }
        }

        return $this->successMethod();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleCustomerSubscriptionCreated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionCreated($payload);

        $this->syncTeamPlan($payload);

        return $response;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleCustomerSubscriptionUpdated(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionUpdated($payload);

        $this->syncTeamPlan($payload);

        return $response;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleCustomerSubscriptionDeleted(array $payload): Response
    {
        $response = parent::handleCustomerSubscriptionDeleted($payload);

        $stripeId = $payload['data']['object']['customer'] ?? null;
        $team = Team::where('stripe_id', $stripeId)->first();

        if ($team) {
            $team->update(['plan' => Plan::Free]);
            app(TokenService::class)->expirePackBalance($team);
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function handleInvoicePaymentSucceeded(array $payload): Response
    {
        $invoice = $payload['data']['object'];
        $billingReason = $invoice['billing_reason'] ?? null;

        if (! in_array($billingReason, ['subscription_create', 'subscription_cycle', 'subscription_update'], true)) {
            return $this->successMethod();
        }

        $stripeId = $invoice['customer'] ?? null;
        $team = Team::where('stripe_id', $stripeId)->first();

        if ($team) {
            app(TokenService::class)->resetIncludedUsage($team);
        }

        return $this->successMethod();
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function syncTeamPlan(array $payload): void
    {
        $subscription = $payload['data']['object'];
        $stripeId = $subscription['customer'] ?? null;
        $priceId = $subscription['items']['data'][0]['price']['id'] ?? null;

        $team = Team::where('stripe_id', $stripeId)->first();

        if ($team && $priceId) {
            $team->update(['plan' => Plan::fromStripePrice($priceId)]);
        }
    }
}
