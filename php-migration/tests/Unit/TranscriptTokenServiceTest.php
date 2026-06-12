<?php

use App\Models\Team;
use App\Models\User;
use App\Services\TranscriptTokenService;

test('transcript token service consumes and credits team balance', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['transcript_tokens' => 2]);

    $service = new TranscriptTokenService;

    $service->consume($team);
    expect($service->available($team->fresh()))->toBe(1);

    $service->credit($team->fresh(), 3, 'cs_test_123');
    expect($service->available($team->fresh()))->toBe(4);
});

test('transcript token credit is idempotent per checkout session', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $service = new TranscriptTokenService;

    $service->credit($team, 5, 'cs_test_duplicate');
    $service->credit($team, 5, 'cs_test_duplicate');

    expect($team->fresh()->transcript_tokens)->toBe(5);
});

test('transcription pack config grants five tokens per purchase', function () {
    expect(config('certalytic.transcription_pack.tokens'))->toBe(5);
});
