<?php

namespace App\Services;

use App\Enums\TokenTransactionType;
use App\Models\Candidate;
use App\Models\Team;
use App\Models\TokenBalance;
use App\Models\TokenTransaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TokenService
{
    public function ensureBalance(Team $team): TokenBalance
    {
        return $team->tokenBalance()->firstOrCreate([], [
            'included_used' => 0,
            'pack_balance' => 0,
        ]);
    }

    public function availableTokens(Team $team): int
    {
        $balance = $this->ensureBalance($team);
        $includedRemaining = max(0, ($team->plan->includedTokens() ?? 0) - $balance->included_used);

        return $includedRemaining + $balance->pack_balance;
    }

    public function canConsume(Team $team, int $amount = 1): bool
    {
        return $this->availableTokens($team) >= $amount;
    }

    public function consume(Team $team, Candidate $candidate, int $amount = 1): void
    {
        if (! $this->canConsume($team, $amount)) {
            throw new RuntimeException('Insufficient tokens to process this screening.');
        }

        DB::transaction(function () use ($team, $candidate, $amount): void {
            $balance = $this->ensureBalance($team->fresh());
            $remaining = $amount;

            $includedQuota = $team->plan->includedTokens() ?? 0;
            $includedRemaining = max(0, $includedQuota - $balance->included_used);

            if ($includedRemaining > 0 && $remaining > 0) {
                $fromIncluded = min($includedRemaining, $remaining);
                $balance->increment('included_used', $fromIncluded);
                $remaining -= $fromIncluded;

                TokenTransaction::create([
                    'team_id' => $team->id,
                    'candidate_id' => $candidate->id,
                    'amount' => -$fromIncluded,
                    'type' => TokenTransactionType::Included,
                ]);
            }

            if ($remaining > 0 && $balance->pack_balance > 0) {
                $fromPack = min($balance->pack_balance, $remaining);
                $balance->decrement('pack_balance', $fromPack);

                TokenTransaction::create([
                    'team_id' => $team->id,
                    'candidate_id' => $candidate->id,
                    'amount' => -$fromPack,
                    'type' => TokenTransactionType::Pack,
                ]);
            }
        });
    }

    public function creditPack(Team $team, int $tokens, ?string $checkoutSessionId = null): void
    {
        if ($checkoutSessionId !== null && TokenTransaction::query()
            ->where('stripe_checkout_session_id', $checkoutSessionId)
            ->exists()) {
            return;
        }

        DB::transaction(function () use ($team, $tokens, $checkoutSessionId): void {
            $balance = $this->ensureBalance($team);
            $balance->increment('pack_balance', $tokens);
            $balance->update([
                'pack_expires_at' => $team->billing_cycle_start?->copy()->addMonth(),
            ]);

            TokenTransaction::create([
                'team_id' => $team->id,
                'candidate_id' => null,
                'amount' => $tokens,
                'type' => TokenTransactionType::PackCredit,
                'stripe_checkout_session_id' => $checkoutSessionId,
            ]);
        });
    }

    public function resetIncludedUsage(Team $team): void
    {
        $balance = $this->ensureBalance($team);
        $balance->update(['included_used' => 0]);
        $team->update(['billing_cycle_start' => now()]);
    }

    public function expirePackBalance(Team $team): void
    {
        $balance = $this->ensureBalance($team);

        if ($balance->pack_balance > 0) {
            $balance->update([
                'pack_balance' => 0,
                'pack_expires_at' => null,
            ]);
        }
    }

    public function usageSummary(Team $team): array
    {
        $plan = $team->plan;
        $balance = $this->ensureBalance($team);
        $includedQuota = $plan->includedTokens() ?? 0;

        return [
            'plan' => $plan->value,
            'plan_label' => $plan->label(),
            'included_quota' => $includedQuota,
            'included_used' => $balance->included_used,
            'included_remaining' => max(0, $includedQuota - $balance->included_used),
            'pack_balance' => $balance->pack_balance,
            'available' => $this->availableTokens($team),
        ];
    }
}
