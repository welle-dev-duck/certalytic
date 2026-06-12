<?php

namespace App\Services;

use App\Enums\Plan;
use App\Models\Team;

class PlanFeatures
{
    public function plan(Team $team): Plan
    {
        if ($team->subscribed('default')) {
            $stripePrice = $team->subscription('default')?->stripe_price;
            $fromStripe = Plan::fromStripePrice($stripePrice);

            if ($fromStripe !== Plan::Free) {
                return $fromStripe;
            }
        }

        return $team->plan;
    }

    public function can(Team $team, string $feature): bool
    {
        $plan = $this->plan($team);

        return match ($feature) {
            'cross_source' => $plan->allowsCrossSource(),
            'cross_source_manual' => $plan->allowsCrossSourceManual(),
            'full_breakdown' => $plan->allowsFullBreakdown(),
            'token_packs' => $plan->allowsTokenPacks(),
            'priority_queue' => $plan->usesPriorityQueue(),
            'watermarked_exports' => $plan->usesWatermarkedExports(),
            'saved_roles' => $plan->allowsSavedRoles(),
            'role_context_assets' => $plan->allowsRoleContextAssets(),
            default => false,
        };
    }

    public function maxRoleDocuments(Team $team): int
    {
        return $this->plan($team)->maxRoleDocuments();
    }

    public function maxSeats(Team $team): int
    {
        return $this->plan($team)->maxSeats();
    }
}
