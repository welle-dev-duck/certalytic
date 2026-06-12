<?php

use App\Enums\Plan;
use App\Models\Team;
use App\Models\User;
use App\Services\TokenService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('csv import creates candidates', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $csv = "name,email,transcript\n";
    $csv .= 'Alice Smith,alice@example.com,"Interviewer: Hi\nCandidate: Hello"'."\n";
    $csv .= 'Bob Jones,bob@example.com,"Interviewer: Start\nCandidate: Sure"'."\n";

    $file = UploadedFile::fake()->createWithContent('candidates.csv', $csv);

    $this->actingAs($user)->post(route('candidates.import.store', $team), [
        'csv' => $file,
    ])->assertRedirect(route('candidates.index', $team));

    expect($team->candidates()->count())->toBe(2);
});

test('bulk import stops when tokens exhausted', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->tokenBalance->update(['included_used' => 3]);

    $csv = "name,transcript\n";
    $csv .= "Alice,Interviewer: Hi\nCandidate: Hello\n";

    $file = UploadedFile::fake()->createWithContent('candidates.csv', $csv);

    $this->actingAs($user)->post(route('candidates.import.store', $team), [
        'csv' => $file,
    ])->assertSessionHasErrors('tokens');
});

test('token service consumes included tokens first', function () {
    $team = Team::factory()->create(['plan' => Plan::Free]);
    $candidate = \App\Models\Candidate::factory()->for($team)->create();
    $service = app(TokenService::class);

    $service->consume($team, $candidate);

    expect($team->tokenBalance->fresh()->included_used)->toBe(1);
    expect($service->availableTokens($team))->toBe(2);
});

test('token pack credit increases pack balance', function () {
    $team = Team::factory()->create(['plan' => Plan::Starter]);
    $service = app(TokenService::class);

    $service->creditPack($team, 10, 'cs_test_123');

    expect($team->tokenBalance->fresh()->pack_balance)->toBe(10);
});
