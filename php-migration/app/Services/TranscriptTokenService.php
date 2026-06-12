<?php

namespace App\Services;

use App\Models\Team;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class TranscriptTokenService
{
    public function available(Team $team): int
    {
        return (int) $team->fresh()->transcript_tokens;
    }

    public function canConsume(Team $team, int $amount = 1): bool
    {
        return $this->available($team) >= $amount;
    }

    public function consume(Team $team, int $amount = 1): void
    {
        if (! $this->canConsume($team, $amount)) {
            throw new RuntimeException('Insufficient transcription tokens.');
        }

        DB::transaction(function () use ($team, $amount): void {
            $locked = Team::query()->whereKey($team->id)->lockForUpdate()->first();

            if ($locked === null || $locked->transcript_tokens < $amount) {
                throw new RuntimeException('Insufficient transcription tokens.');
            }

            $locked->decrement('transcript_tokens', $amount);
        });
    }

    public function credit(Team $team, int $amount, ?string $checkoutSessionId = null): void
    {
        if ($checkoutSessionId !== null) {
            $alreadyCredited = DB::table('transcript_token_credits')
                ->where('stripe_checkout_session_id', $checkoutSessionId)
                ->exists();

            if ($alreadyCredited) {
                return;
            }

            DB::table('transcript_token_credits')->insert([
                'team_id' => $team->id,
                'amount' => $amount,
                'stripe_checkout_session_id' => $checkoutSessionId,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $team->increment('transcript_tokens', $amount);
    }
}
