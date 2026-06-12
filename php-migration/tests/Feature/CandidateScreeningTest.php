<?php

use App\Contracts\CandidateEvaluator;
use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Models\Candidate;
use App\Models\Team;
use App\Services\CaptionFileParser;
use App\Services\IntegrityScoreCalculator;
use App\Services\TranscriptProcessor;
use Tests\Fixtures\FixtureLoader;

test('transcript processor truncates long transcripts', function () {
    $processor = new TranscriptProcessor;

    $longTranscript = str_repeat('word ', 50_000);

    $result = $processor->process($longTranscript);

    expect($result['was_truncated'])->toBeTrue();
    expect(mb_strlen($result['text']))->toBeLessThanOrEqual(120_000);
});

test('transcript soft warning threshold', function () {
    $processor = new TranscriptProcessor;

    $short = implode(' ', array_fill(0, 100, 'word'));
    $long = implode(' ', array_fill(0, 25_000, 'word'));

    expect($processor->exceedsSoftWarning($short))->toBeFalse();
    expect($processor->exceedsSoftWarning($long))->toBeTrue();
});

test('integrity score calculator applies weights', function () {
    $calculator = new IntegrityScoreCalculator;

    $score = $calculator->calculate([
        's_cv' => ['score' => 80],
        's_int' => ['score' => 70],
        's_cross' => ['score' => 60],
        's_id' => ['score' => 90],
    ]);

    expect($score)->toBe(73.0);
});

test('rolling interview score returns the single segment score', function () {
    $calculator = new IntegrityScoreCalculator;

    $score = $calculator->rollingInterviewScore([
        1 => 82.0,
    ]);

    expect($score)->toBe(82.0);
});

test('rolling interview score weights multiple virtual segments', function () {
    $calculator = new IntegrityScoreCalculator;

    $score = $calculator->rollingInterviewScore([
        1 => 80.0,
        2 => 60.0,
        3 => 70.0,
    ]);

    expect($score)->toBe(69.0);
});

test('high inconsistency detected above threshold', function () {
    $calculator = new IntegrityScoreCalculator;

    expect($calculator->hasHighInconsistency(25))->toBeTrue();
    expect($calculator->hasHighInconsistency(10))->toBeFalse();
});

test('screening job completes candidate', function () {
    $team = Team::factory()->create();
    $candidate = Candidate::factory()->for($team)->create([
        'status' => CandidateStatus::Pending,
        'cv_text' => 'Jane Doe - Senior Software Engineer with Laravel and React experience.',
        'cv_format' => CvFormat::Text,
    ]);

    $candidate->interviewRounds()->create([
        'round_number' => 1,
        'transcript_text' => 'Interviewer: Question.'."\n".'Candidate: Answer.',
    ]);

    ProcessCandidateScreeningJob::dispatchSync($candidate);

    $candidate->refresh();

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->integrity_score)->not->toBeNull();
    expect($candidate->score_breakdown)->toBeArray();
});

test('screening job syncs virtual interview segments from round analyses', function () {
    $team = Team::factory()->create();
    $candidate = Candidate::factory()->for($team)->create([
        'status' => CandidateStatus::Pending,
        'cv_text' => 'Jane Doe - Senior Software Engineer with Laravel and React experience.',
        'cv_format' => CvFormat::Text,
    ]);

    $candidate->interviewRounds()->create([
        'round_number' => 1,
        'transcript_text' => "Round 1 behavioral.\n\nRound 2 technical deep dive.",
    ]);

    $evaluation = [
        's_cv' => ['score' => 80, 'summary' => 'OK', 'indicators' => [], 'confidence_band' => 'high'],
        's_int' => ['score' => 70, 'summary' => 'OK', 'indicators' => [], 'confidence_band' => 'high'],
        's_cross' => [
            'score' => null,
            'summary' => 'Skipped',
            'indicators' => ['Platform checks skipped - insufficient external profile data.'],
            'confidence_band' => 'not-evaluated',
        ],
        's_id' => ['score' => 75, 'summary' => 'OK', 'indicators' => [], 'confidence_band' => 'high'],
        'follow_up_suggested' => [],
        'anomalies' => [],
        'round_analyses' => [
            [
                'round_number' => 1,
                's_int' => 85,
                's_id' => 80,
                'observations' => ['Natural conversational tone in behavioral section.'],
                'anomalies' => [],
                'deep_dive_prompts' => ['Probe live coding comfort.'],
            ],
            [
                'round_number' => 2,
                's_int' => 45,
                's_id' => 70,
                'observations' => ['Technical answers shifted to textbook phrasing.'],
                'anomalies' => ['Large stylistic shift between segments.'],
                'deep_dive_prompts' => [],
            ],
        ],
        'flags' => [],
        'platform_matrix' => [
            'linkedin_cv_match' => ['score' => null, 'explanation' => 'Not submitted.'],
            'github_experience_match' => ['score' => null, 'explanation' => 'Not submitted.'],
            'cross_platform_consistency' => ['score' => null, 'explanation' => 'Not submitted.'],
        ],
    ];

    $this->mock(CandidateEvaluator::class, function ($mock) use ($evaluation): void {
        $mock->shouldReceive('evaluate')->once()->andReturn($evaluation);
    });

    ProcessCandidateScreeningJob::dispatchSync($candidate);

    $candidate->refresh()->load('interviewRounds');

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->score_breakdown['round_analyses'] ?? [])->toHaveCount(2);
    expect($candidate->interviewRounds)->toHaveCount(2);
    expect($candidate->interviewRounds->firstWhere('round_number', 1)?->transcript_text)
        ->toContain('Round 1 behavioral');
    expect($candidate->interviewRounds->firstWhere('round_number', 2)?->transcript_text)
        ->toBe('[Segment identified in merged transcript]');
    expect((float) $candidate->interviewRounds->firstWhere('round_number', 2)?->variance_delta)->toBe(40.0);
    expect($candidate->high_inconsistency_warning)->toBeTrue();
});

test('suspicious vtt transcript prevents high integrity when model over-scores interview', function () {
    $parser = app(CaptionFileParser::class);
    $transcript = $parser->parseContents(FixtureLoader::read('susp.vtt'), 'vtt');

    $team = Team::factory()->create();
    $candidate = Candidate::factory()->for($team)->create([
        'status' => CandidateStatus::Pending,
        'cv_text' => 'Bertold - Backend engineer with NestJS and Node.js experience.',
        'cv_format' => CvFormat::Text,
    ]);

    $candidate->interviewRounds()->create([
        'round_number' => 1,
        'transcript_text' => $transcript,
    ]);

    $evaluation = [
        's_cv' => ['score' => 82, 'summary' => 'CV appears coherent.', 'indicators' => [], 'confidence_band' => 'high'],
        's_int' => ['score' => 85, 'summary' => 'Strong technical depth.', 'indicators' => [], 'confidence_band' => 'high'],
        's_cross' => [
            'score' => null,
            'summary' => 'Skipped',
            'indicators' => ['Platform checks skipped - insufficient external profile data.'],
            'confidence_band' => 'not-evaluated',
        ],
        's_id' => ['score' => 80, 'summary' => 'Identity signals acceptable.', 'indicators' => [], 'confidence_band' => 'high'],
        'follow_up_suggested' => [],
        'anomalies' => [],
        'round_analyses' => [],
        'flags' => [],
        'platform_matrix' => [
            'linkedin_cv_match' => ['score' => null, 'explanation' => 'Not submitted.'],
            'github_experience_match' => ['score' => null, 'explanation' => 'Not submitted.'],
            'cross_platform_consistency' => ['score' => null, 'explanation' => 'Not submitted.'],
        ],
    ];

    $this->mock(CandidateEvaluator::class, function ($mock) use ($evaluation): void {
        $mock->shouldReceive('evaluate')->once()->andReturn($evaluation);
    });

    ProcessCandidateScreeningJob::dispatchSync($candidate);

    $candidate->refresh();

    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->score_breakdown['s_int']['score'])->toBeLessThanOrEqual(40.0);
    expect((float) $candidate->integrity_score)->toBeLessThan(75.0);
    expect(collect($candidate->score_breakdown['flags'] ?? [])->pluck('type'))->toContain('interview_prompt');
});
