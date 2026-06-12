<?php

use App\Contracts\PublicProfileFetcher;
use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Enums\Plan;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Models\Candidate;
use App\Models\Team;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\Fixtures\FixtureLoader;
use Tests\Fixtures\ScenarioScreeningRunner;
use Tests\Fixtures\Scenarios\HonestCandidateScenario;
use Tests\Fixtures\Scenarios\SuspiciousCandidateScenario;
use Tests\Fixtures\Mocks\ScenarioPublicProfileFetcher;

test('fixture files are present for both screening scenarios', function () {
    expect(FixtureLoader::jobDescription())->toContain('Golang');

    foreach ([new HonestCandidateScenario, new SuspiciousCandidateScenario] as $scenario) {
        expect($scenario->cvText())->not->toBeEmpty();
        expect($scenario->linkedinProfileText())->not->toBeEmpty();
        expect($scenario->transcripts())->toHaveCount(1);
    }
});

test('scenario 1 honest candidate completes with strong integrity score', function () {
    $team = ScenarioScreeningRunner::teamWithGrowthPlan();
    $scenario = new HonestCandidateScenario;

    $candidate = ScenarioScreeningRunner::run($scenario, $team);

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->integrity_score)->toBeGreaterThanOrEqual(85);
    expect($candidate->high_inconsistency_warning)->toBeFalse();
    expect($candidate->score_breakdown['s_cross']['score'])->toBeGreaterThanOrEqual(85);
    expect($candidate->score_breakdown['s_int']['score'])->toBeGreaterThanOrEqual(80);
    expect($candidate->score_breakdown['anomalies'] ?? [])->toBeEmpty();
    expect($candidate->interviewRounds)->toHaveCount(1);
    expect($candidate->job_description)->toContain('Senior Backend Engineer');
});

test('scenario 2 suspicious candidate completes with low trust signals', function () {
    $team = ScenarioScreeningRunner::teamWithGrowthPlan();
    $scenario = new SuspiciousCandidateScenario;

    $candidate = ScenarioScreeningRunner::run($scenario, $team);

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->integrity_score)->toBeLessThan(65);
    expect($candidate->score_breakdown['s_cross']['score'])->toBeLessThan(45);
    expect($candidate->score_breakdown['s_cv']['score'])->toBeLessThan(65);
    expect($candidate->score_breakdown['s_int']['score'])->toBeLessThan(55);
    expect($candidate->score_breakdown['anomalies'])->not->toBeEmpty();
    expect($candidate->follow_up_suggested)->not->toBeEmpty();
    expect($candidate->score_breakdown['anomalies'])->toContain('LinkedIn timeline conflicts with stated five-year Go specialization.');
});

test('scenario 1 mistral http mocks produce high integrity screening end to end', function () {
    Storage::fake('local');

    ScenarioScreeningRunner::bindRealMistralServices();

    $scenario = new HonestCandidateScenario;
    ScenarioScreeningRunner::fakeMistral($scenario);

    test()->instance(PublicProfileFetcher::class, new ScenarioPublicProfileFetcher($scenario));

    $team = Team::factory()->create(['plan' => Plan::Growth]);
    $candidate = Candidate::factory()->for($team)->create([
        'name' => $scenario->candidateName(),
        'role' => $scenario->role(),
        'job_description' => FixtureLoader::jobDescription(),
        'cv_path' => 'cvs/elena.pdf',
        'cv_text' => null,
        'cv_format' => CvFormat::Pdf,
        'linkedin_text' => $scenario->linkedinProfileText(),
        'status' => CandidateStatus::Pending,
    ]);

    Storage::put('cvs/elena.pdf', '%PDF-1.4 certalytic-fixture');

    foreach ($scenario->transcripts() as $index => $transcript) {
        $candidate->interviewRounds()->create([
            'round_number' => $index + 1,
            'transcript_text' => $transcript,
        ]);
    }

    ProcessCandidateScreeningJob::dispatchSync($candidate);

    Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/ocr'));
    Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/chat/completions'));

    $candidate->refresh();

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->integrity_score)->toBeGreaterThanOrEqual(85);
});

test('scenario 2 mistral http mocks surface cross source and interview trust issues', function () {
    ScenarioScreeningRunner::bindRealMistralServices();

    $scenario = new SuspiciousCandidateScenario;
    ScenarioScreeningRunner::fakeMistral($scenario);

    test()->instance(PublicProfileFetcher::class, new ScenarioPublicProfileFetcher($scenario));

    $team = Team::factory()->create(['plan' => Plan::Growth]);
    $candidate = Candidate::factory()->for($team)->create([
        'name' => $scenario->candidateName(),
        'role' => $scenario->role(),
        'job_description' => FixtureLoader::jobDescription(),
        'cv_text' => $scenario->cvText(),
        'cv_format' => CvFormat::Text,
        'linkedin_text' => $scenario->linkedinProfileText(),
        'status' => CandidateStatus::Pending,
    ]);

    foreach ($scenario->transcripts() as $index => $transcript) {
        $candidate->interviewRounds()->create([
            'round_number' => $index + 1,
            'transcript_text' => $transcript,
        ]);
    }

    ProcessCandidateScreeningJob::dispatchSync($candidate);

    Http::assertSent(fn ($request) => str_contains($request->url(), '/v1/chat/completions'));

    $candidate->refresh();

    expect($candidate->integrity_score)->toBeLessThan(65);
    expect($candidate->score_breakdown['anomalies'])->not->toBeEmpty();
});
