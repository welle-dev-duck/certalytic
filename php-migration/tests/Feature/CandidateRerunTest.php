<?php

use App\Enums\CandidateStatus;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Models\Team;
use App\Models\User;
use App\Services\TokenService;
use Illuminate\Support\Facades\Queue;

test('candidate screening can be re-run', function () {
    Queue::fake();

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $candidate = Candidate::factory()->for($team)->complete()->create([
        'integrity_score' => 78,
        'score_breakdown' => ['s_int' => ['score' => 85]],
        'follow_up_suggested' => ['Ask a follow-up question.'],
        'high_inconsistency_warning' => true,
        'processed_at' => now(),
    ]);

    InterviewRound::factory()->for($candidate)->create([
        'round_number' => 1,
        'round_scores' => ['s_int' => 85],
        'variance_delta' => 12,
    ]);

    InterviewRound::factory()->for($candidate)->create([
        'round_number' => 2,
        'transcript_text' => '[Segment identified in merged transcript]',
        'round_scores' => ['s_int' => 45],
    ]);

    $tokensBefore = app(TokenService::class)->availableTokens($team);

    $this->actingAs($user)
        ->post(route('candidates.rerun', [$team, $candidate]))
        ->assertRedirect(route('candidates.show', [$team, $candidate]));

    $candidate->refresh();

    expect($candidate->status)->toBe(CandidateStatus::Pending);
    expect($candidate->integrity_score)->toBeNull();
    expect($candidate->score_breakdown)->toBeNull();
    expect($candidate->follow_up_suggested)->toBeNull();
    expect($candidate->high_inconsistency_warning)->toBeFalse();
    expect($candidate->processed_at)->toBeNull();
    expect($candidate->interviewRounds)->toHaveCount(1);
    expect($candidate->interviewRounds->first()->round_scores)->toBeNull();

    expect(app(TokenService::class)->availableTokens($team))->toBe($tokensBefore - 1);

    Queue::assertPushed(ProcessCandidateScreeningJob::class);
});

test('re-run fails when team has no tokens', function () {
    Queue::fake();

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->tokenBalance()->update([
        'included_used' => $team->plan->includedTokens(),
        'pack_balance' => 0,
    ]);

    $candidate = Candidate::factory()->for($team)->complete()->create();
    InterviewRound::factory()->for($candidate)->create();

    $this->actingAs($user)
        ->from(route('candidates.show', [$team, $candidate]))
        ->post(route('candidates.rerun', [$team, $candidate]))
        ->assertRedirect(route('candidates.show', [$team, $candidate]))
        ->assertSessionHasErrors('rerun');

    Queue::assertNothingPushed();
});

test('re-run fails when candidate has no interview transcripts', function () {
    Queue::fake();

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $candidate = Candidate::factory()->for($team)->complete()->create();

    $this->actingAs($user)
        ->post(route('candidates.rerun', [$team, $candidate]))
        ->assertSessionHasErrors('rerun');

    Queue::assertNothingPushed();
});
