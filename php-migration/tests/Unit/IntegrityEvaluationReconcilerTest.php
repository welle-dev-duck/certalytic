<?php

use App\Services\IntegrityEvaluationReconciler;

test('reconciler caps interview score when live prompt flags are raised', function () {
    $reconciler = new IntegrityEvaluationReconciler;

    $evaluation = $reconciler->reconcile([
        's_cv' => ['score' => 65, 'summary' => 'Mixed CV signals.'],
        's_int' => ['score' => 85, 'summary' => 'Strong technical depth.'],
        's_cross' => ['score' => 100, 'summary' => 'Skipped.'],
        's_id' => ['score' => 40, 'summary' => 'Weak identity provenance.'],
        'flags' => [
            [
                'type' => 'interview_prompt',
                'severity' => 'critical',
                'description' => 'Systematic latency before answers suggests live prompt assistance.',
                'confidence' => 0.98,
            ],
            [
                'type' => 'ai_text',
                'severity' => 'critical',
                'description' => 'Extreme linguistic variance between conversational tone and textbook technical prose in the interview.',
                'confidence' => 0.99,
            ],
        ],
        'round_analyses' => [
            [
                'round_number' => 1,
                's_int' => 85,
                's_id' => 40,
                'observations' => ['Candidate demonstrates deep technical knowledge of Go internals.'],
                'anomalies' => [],
                'deep_dive_prompts' => [],
            ],
        ],
    ], hasExternalProfiles: false);

    expect($evaluation['s_int']['score'])->toBe(40.0);
    expect($evaluation['round_analyses'][0]['s_int'])->toBe(40.0);
    expect($evaluation['round_analyses'][0]['observations'])->toContain(
        'Systematic latency before answers suggests live prompt assistance.',
    );
});

test('reconciler downgrades misleading platform mismatch when no profiles submitted', function () {
    $reconciler = new IntegrityEvaluationReconciler;

    $evaluation = $reconciler->reconcile([
        's_cv' => ['score' => 70, 'summary' => 'OK'],
        's_int' => ['score' => 70, 'summary' => 'OK'],
        's_cross' => ['score' => 100, 'summary' => 'Skipped'],
        's_id' => ['score' => 70, 'summary' => 'OK'],
        'flags' => [
            [
                'type' => 'platform_mismatch',
                'severity' => 'critical',
                'description' => 'No public profiles were provided for cross-validation.',
                'confidence' => 1,
            ],
        ],
        'round_analyses' => [],
    ], hasExternalProfiles: false);

    expect($evaluation['flags'][0]['type'])->toBe('insufficient_signal');
    expect($evaluation['flags'][0]['severity'])->toBe('info');
});
