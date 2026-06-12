<?php

use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Models\Team;
use App\Services\CandidateReport;

test('candidate report does not flag platform mismatch when no profiles submitted', function () {
    $team = Team::factory()->create();

    $candidate = Candidate::factory()->for($team)->create([
        'linkedin_url' => null,
        'github_username' => null,
        'integrity_score' => 62,
        'score_breakdown' => [
            's_cv' => ['score' => 75, 'summary' => 'CV looks mostly human.', 'indicators' => []],
            's_int' => ['score' => 68, 'summary' => 'Interview ok.', 'indicators' => []],
            's_cross' => ['score' => 100, 'summary' => 'No profiles submitted.', 'indicators' => []],
            's_id' => ['score' => 80, 'summary' => 'Identity ok.', 'indicators' => []],
            'platform_matrix' => [
                'linkedin_cv_match' => ['score' => null, 'explanation' => 'No LinkedIn submitted.'],
                'github_experience_match' => ['score' => null, 'explanation' => 'No GitHub submitted.'],
                'cross_platform_consistency' => ['score' => null, 'explanation' => 'Not scored.'],
            ],
        ],
    ]);

    $report = CandidateReport::build($candidate->load('interviewRounds'));

    expect($report['platformMatrix']['cross_platform_consistency']['score'])->toBeNull();
    expect(collect($report['flags'])->pluck('type'))->not->toContain('platform_mismatch');
});

test('candidate report uses stored round observations for interview insights', function () {
    $team = Team::factory()->create();

    $candidate = Candidate::factory()->for($team)->create([
        'integrity_score' => 38,
        'high_inconsistency_warning' => true,
        'score_breakdown' => [
            's_cv' => ['score' => 75, 'summary' => 'CV mixed.', 'indicators' => []],
            's_int' => ['score' => 28, 'summary' => 'Live assistance likely.', 'indicators' => ['31-second gap before answer']],
            's_cross' => ['score' => 100, 'summary' => 'Skipped.', 'indicators' => []],
            's_id' => ['score' => 65, 'summary' => 'Identity mixed.', 'indicators' => []],
        ],
    ]);

    InterviewRound::factory()->for($candidate)->create([
        'round_number' => 1,
        'round_scores' => [
            's_int' => 22,
            's_id' => 40,
            'observations' => [
                'Recruiter notes document an LLM pivot from hesitation into formal monologue.',
            ],
        ],
    ]);

    $report = CandidateReport::build($candidate->load('interviewRounds'));

    expect($report['rounds'][0]['s_int'])->toBe(22);
    expect($report['rounds'][0]['observations'][0])->toContain('LLM pivot');
    expect(collect($report['flags'])->pluck('type'))->toContain('interview_prompt');
});

test('candidate report uses decision support language instead of hire reject verdicts', function () {
    $team = Team::factory()->create();

    $candidate = Candidate::factory()->for($team)->create([
        'integrity_score' => 38,
        'score_breakdown' => [
            's_cv' => ['score' => 55, 'summary' => 'CV may show limited Go depth.', 'indicators' => []],
            's_int' => ['score' => 28, 'summary' => 'Interview latency patterns may suggest rehearsed responses.', 'indicators' => []],
            's_cross' => ['score' => 100, 'summary' => 'Platform checks skipped.', 'indicators' => []],
            's_id' => ['score' => 65, 'summary' => 'Identity mixed.', 'indicators' => []],
        ],
    ]);

    $report = CandidateReport::build($candidate->load('interviewRounds'));

    expect($report['verdict']['title'])->toBe('SIGNAL ASSESSMENT: Elevated integrity risk indicators');
    expect($report['verdict']['title'])->not->toContain('DO NOT ADVANCE');
    expect($report['verdict']['title'])->not->toContain('PROCEED');
    expect($report['recommendedActions'])->not->toContain('Do not advance pending escalation');
});

test('candidate report downgrades strong signal assessment when integrity flags are active', function () {
    $team = Team::factory()->create();

    $candidate = Candidate::factory()->for($team)->create([
        'integrity_score' => 78,
        'score_breakdown' => [
            's_cv' => ['score' => 65, 'summary' => 'Mixed CV authenticity.', 'indicators' => []],
            's_int' => ['score' => 55, 'summary' => 'Interview authenticity concerns after reconciliation.', 'indicators' => []],
            's_cross' => ['score' => 100, 'summary' => 'Platform checks skipped.', 'indicators' => []],
            's_id' => ['score' => 40, 'summary' => 'Weak identity provenance.', 'indicators' => []],
            'flags' => [
                [
                    'type' => 'interview_prompt',
                    'severity' => 'warning',
                    'description' => 'Systematic latency before answers suggests live prompt assistance.',
                    'confidence' => 0.98,
                ],
                [
                    'type' => 'interview_prompt',
                    'severity' => 'warning',
                    'description' => 'Extreme linguistic variance between conversational tone and textbook technical prose.',
                    'confidence' => 0.99,
                ],
            ],
        ],
    ]);

    $report = CandidateReport::build($candidate->load('interviewRounds'));

    expect($report['verdict']['title'])->toBe('SIGNAL ASSESSMENT: Mixed integrity signals - follow-up suggested');
    expect($report['verdict']['title'])->not->toBe('SIGNAL ASSESSMENT: Comparatively strong authentic signal density');
    expect($report['verdict']['title'])->not->toContain('DO NOT ADVANCE');
});

test('candidate report exposes supplementary behaviour and personality analyses', function () {
    $team = Team::factory()->create();

    $candidate = Candidate::factory()->for($team)->create([
        'integrity_score' => 72,
        'score_breakdown' => [
            's_cv' => ['score' => 75, 'summary' => 'CV ok.', 'indicators' => []],
            's_int' => ['score' => 70, 'summary' => 'Interview ok.', 'indicators' => []],
            's_cross' => ['score' => 100, 'summary' => 'Skipped.', 'indicators' => []],
            's_id' => ['score' => 80, 'summary' => 'Identity ok.', 'indicators' => []],
            'behaviour_analysis' => [
                'summary' => 'Direct communicator with structured technical answers.',
                'traits' => ['Collaborative'],
                'detail_label' => 'Communication style',
                'detail' => 'Concise and deliberate.',
                'indicators' => ['References stakeholders naturally'],
                'motivation_signals' => [],
                'concerns' => [],
            ],
            'personality_analysis' => [
                'summary' => 'Motivated by ownership and delivery predictability.',
                'traits' => ['Pragmatic'],
                'detail_label' => 'Work style',
                'detail' => 'Process-oriented.',
                'indicators' => ['Comfortable in regulated teams'],
                'motivation_signals' => ['Cites customer impact'],
                'concerns' => [],
            ],
        ],
    ]);

    $report = CandidateReport::build($candidate->load('interviewRounds'));

    expect($report['behaviourAnalysis']['summary'])->toContain('Direct communicator');
    expect($report['personalityAnalysis']['motivationSignals'])->toContain('Cites customer impact');
    expect($report['score'])->toBe(72);
});
