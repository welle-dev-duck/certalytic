<?php

namespace App\Enums;

enum Plan: string
{
    case Free = 'free';
    case Starter = 'starter';
    case Growth = 'growth';
    case Scale = 'scale';
    case Enterprise = 'enterprise';

    /**
     * @return array<string, mixed>
     */
    public function config(): array
    {
        return config('certalytic.plans.'.$this->value);
    }

    public function label(): string
    {
        return $this->config()['name'];
    }

    public function includedTokens(): ?int
    {
        return $this->config()['tokens'];
    }

    public function maxSeats(): int
    {
        return $this->config()['seats'];
    }

    public function allowsCrossSource(): bool
    {
        return $this->config()['cross_source'];
    }

    public function allowsCrossSourceManual(): bool
    {
        return $this->config()['cross_source_manual'];
    }

    public function allowsFullBreakdown(): bool
    {
        return $this->config()['full_breakdown'];
    }

    public function allowsTokenPacks(): bool
    {
        return $this->config()['token_packs'];
    }

    public function usesPriorityQueue(): bool
    {
        return $this->config()['priority_queue'];
    }

    public function usesWatermarkedExports(): bool
    {
        return $this->config()['watermarked_exports'];
    }

    public function allowsSavedRoles(): bool
    {
        return $this->config()['saved_roles'];
    }

    public function allowsRoleContextAssets(): bool
    {
        return $this->config()['role_context_assets'];
    }

    public function maxRoleDocuments(): int
    {
        return $this->config()['max_role_documents'];
    }

    public function stripePriceId(): ?string
    {
        return $this->config()['stripe_price'];
    }

    public static function fromStripePrice(?string $priceId): self
    {
        if ($priceId === null) {
            return self::Free;
        }

        foreach (self::cases() as $plan) {
            if ($plan->stripePriceId() === $priceId) {
                return $plan;
            }
        }

        return self::Free;
    }

    /**
     * Human-readable feature bullets for billing plan cards.
     *
     * @return list<string>
     */
    public function billingFeatures(): array
    {
        $config = $this->config();
        $features = [];

        if ($config['tokens'] !== null) {
            $features[] = $config['tokens'].' screenings / month';
        }

        $features[] = $config['seats'].' team seat'.($config['seats'] > 1 ? 's' : '');

        $features[] = 'Technical interview integrity analysis';
        $features[] = 'Candidate behaviour analysis';
        $features[] = 'Candidate personality analysis';

        $features[] = $config['full_breakdown']
            ? 'Full integrity score breakdown'
            : 'Summary integrity score';

        if ($config['saved_roles']) {
            $features[] = 'Saved Role Profiles';
        }

        if ($config['cross_source_manual']) {
            $features[] = 'LinkedIn cross-check';
            $features[] = 'GitHub cross-check';
        }

        if ($config['priority_queue']) {
            $features[] = 'Priority background processing';
        }

        if ($config['watermarked_exports']) {
            $features[] = 'Watermarked exports';
        }

        return $features;
    }

    public function previousPlan(): ?self
    {
        return match ($this) {
            self::Growth => self::Starter,
            self::Scale => self::Growth,
            default => null,
        };
    }

    /**
     * Features introduced at this plan tier (excluding lower tiers).
     *
     * @return list<string>
     */
    public function incrementalBillingFeatures(): array
    {
        $current = $this->billingFeatures();
        $previous = $this->previousPlan()?->billingFeatures() ?? [];

        return array_values(array_diff($current, $previous));
    }
}
