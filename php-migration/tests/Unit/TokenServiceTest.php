<?php

use App\Enums\Plan;
use App\Models\Candidate;
use App\Models\Team;
use App\Services\TokenService;

test('free plan starts with three available tokens', function () {
    $team = Team::factory()->create(['plan' => Plan::Free]);
    $service = app(TokenService::class);

    expect($service->availableTokens($team))->toBe(3);
});

test('consume throws when no tokens remain', function () {
    $team = Team::factory()->create(['plan' => Plan::Free]);
    $service = app(TokenService::class);
    $team->tokenBalance->update(['included_used' => 3]);

    $candidate = Candidate::factory()->for($team)->create();

    expect(fn () => $service->consume($team, $candidate))
        ->toThrow(RuntimeException::class);
});

test('creditPack is idempotent for the same checkout session', function () {
    $team = Team::factory()->create(['plan' => Plan::Starter]);
    $service = app(TokenService::class);

    $service->creditPack($team, 10, 'cs_test_duplicate');
    $service->creditPack($team, 10, 'cs_test_duplicate');

    expect($team->tokenBalance->fresh()->pack_balance)->toBe(10);
    expect(\App\Models\TokenTransaction::where('stripe_checkout_session_id', 'cs_test_duplicate')->count())->toBe(1);
});

test('reset included usage clears counter', function () {
    $team = Team::factory()->create(['plan' => Plan::Starter]);
    $service = app(TokenService::class);

    $team->tokenBalance->update(['included_used' => 20]);
    $service->resetIncludedUsage($team);

    expect($team->tokenBalance->fresh()->included_used)->toBe(0);
});
