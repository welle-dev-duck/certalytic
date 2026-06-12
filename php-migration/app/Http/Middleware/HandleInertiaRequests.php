<?php

namespace App\Http\Middleware;

use App\Enums\Plan;
use App\Services\PlanFeatures;
use App\Services\TokenService;
use App\Services\TranscriptTokenService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'currentTeam' => fn () => $user?->currentTeam ? $user->toUserTeam($user->currentTeam) : null,
            'teams' => fn () => $user?->toUserTeams(includeCurrent: true) ?? [],
            'canSavedRoles' => fn () => $user?->currentTeam !== null
                && app(PlanFeatures::class)->can($user->currentTeam, 'saved_roles'),
            'tokenUsage' => fn () => $user?->currentTeam !== null
                ? app(TokenService::class)->usageSummary($user->currentTeam)
                : null,
            'transcriptTokens' => fn () => $user?->currentTeam !== null
                ? app(TranscriptTokenService::class)->available($user->currentTeam)
                : 0,
            'uploadLimits' => fn () => [
                'cv_max_kilobytes' => config('certalytic.limits.cv_max_kilobytes'),
                'cv_text_max_words' => config('certalytic.limits.cv_text_max_words'),
                'cv_text_max_characters' => config('certalytic.limits.cv_text_max_characters'),
                'transcript_text_max_words' => config('certalytic.limits.transcript_text_max_words'),
                'transcript_text_max_characters' => config('certalytic.limits.transcript_text_max_characters'),
                'transcript_file_max_kilobytes' => config('certalytic.limits.transcript_file_max_kilobytes'),
                'audio_max_minutes' => config('certalytic.limits.audio_max_duration_minutes'),
                'audio_max_megabytes' => (int) round(config('certalytic.limits.audio_max_kilobytes') / 1024),
            ],
            'fieldLimits' => fn () => [
                'name_max_characters' => config('certalytic.limits.name_max_characters'),
                'email_max_characters' => config('certalytic.limits.email_max_characters'),
                'linkedin_text_max_characters' => config('certalytic.limits.linkedin_text_max_characters'),
                'interviewer_notes_max_characters' => config('certalytic.limits.interviewer_notes_max_characters'),
                'github_url_max_characters' => config('certalytic.limits.github_url_max_characters'),
                'role_title_max_characters' => config('certalytic.limits.role_title_max_characters'),
                'role_description_max_characters' => config('certalytic.limits.role_description_max_characters'),
            ],
            'maxTeamsPerUser' => config('certalytic.max_teams_per_user'),
            'company' => fn () => config('certalytic.company'),
            'socialLinks' => fn () => config('certalytic.social'),
            'marketing' => fn () => $this->marketingData(),
            'canCreateTeam' => fn () => $user !== null
                && $user->nonPersonalTeamsCount() < config('certalytic.max_teams_per_user'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function marketingData(): array
    {
        $free = Plan::Free;

        return [
            'stats' => config('certalytic.marketing.stats'),
            'roadmap' => config('certalytic.marketing.roadmap'),
            'pricing' => [
                'free' => [
                    'value' => $free->value,
                    'label' => $free->label(),
                    'price' => $free->config()['price'],
                    'tokens' => $free->includedTokens(),
                    'seats' => $free->maxSeats(),
                    'features' => $free->billingFeatures(),
                    'highlighted' => true,
                ],
                'plans' => collect([Plan::Starter, Plan::Growth, Plan::Scale])
                    ->map(fn (Plan $plan) => [
                        'value' => $plan->value,
                        'label' => $plan->label(),
                        'price' => $plan->config()['price'],
                        'tokens' => $plan->includedTokens(),
                        'seats' => $plan->maxSeats(),
                        'features' => $plan->billingFeatures(),
                        'highlighted' => $plan === Plan::Growth,
                    ])
                    ->values()
                    ->all(),
                'enterprise' => [
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
            ],
        ];
    }
}
