<?php

use App\Services\IntegrityScoreCalculator;
use App\Services\TranscriptProcessor;

test('integrity score single round returns same score', function () {
    $calculator = new IntegrityScoreCalculator;

    expect($calculator->rollingInterviewScore([1 => 75.0]))->toBe(75.0);
});

test('integrity score multi segment uses configured weights', function () {
    $calculator = new IntegrityScoreCalculator;

    expect($calculator->rollingInterviewScore([
        1 => 80.0,
        2 => 60.0,
        3 => 70.0,
    ]))->toBe(69.0);
});

test('variance delta is absolute difference', function () {
    $calculator = new IntegrityScoreCalculator;

    expect($calculator->varianceDelta(80, 55))->toBe(25.0);
});

test('integrity score excludes skipped cross source and renormalizes remaining weights', function () {
    $calculator = new IntegrityScoreCalculator;

    $withCrossSource = [
        's_cv' => ['score' => 80],
        's_int' => ['score' => 70],
        's_cross' => ['score' => 60],
        's_id' => ['score' => 90],
    ];

    $withoutCrossSource = [
        's_cv' => ['score' => 80],
        's_int' => ['score' => 70],
        's_cross' => [
            'score' => null,
            'confidence_band' => 'not-evaluated',
            'summary' => 'Skipped.',
        ],
        's_id' => ['score' => 90],
    ];

    expect($calculator->calculate($withCrossSource))->toBe(73.0);
    expect($calculator->calculate($withoutCrossSource))->toBe(75.29);
});

test('integrity score ignores supplementary behaviour and personality analyses', function () {
    $calculator = new IntegrityScoreCalculator;

    $baseComponents = [
        's_cv' => ['score' => 80],
        's_int' => ['score' => 70],
        's_cross' => ['score' => 60],
        's_id' => ['score' => 90],
    ];

    $withSupplementary = [
        ...$baseComponents,
        'behaviour_analysis' => ['score' => 0, 'summary' => 'Concerning behaviour'],
        'personality_analysis' => ['score' => 100, 'summary' => 'Ideal personality'],
    ];

    expect($calculator->calculate($baseComponents))->toBe(73.0);
    expect($calculator->calculate($calculator->scoreComponentsFromEvaluation($withSupplementary)))->toBe(73.0);
});

test('transcript under cap is not truncated', function () {
    $processor = new TranscriptProcessor;
    $text = 'Interviewer: Hello'."\n".'Candidate: Hi there friend.';

    $result = $processor->process($text);

    expect($result['was_truncated'])->toBeFalse();
    expect($result['text'])->toBe($text);
});
