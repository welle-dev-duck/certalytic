<?php

use App\Services\CaptionFileParser;
use App\Services\IntegrityEvaluationReconciler;
use App\Services\IntegrityScoreCalculator;
use App\Services\TranscriptIntegritySignalDetector;
use Tests\Fixtures\FixtureLoader;

test('suspicious vtt fixture triggers live prompt integrity flags', function () {
    $parser = app(CaptionFileParser::class);
    $detector = new TranscriptIntegritySignalDetector;

    $transcript = $parser->parseContents(FixtureLoader::read('susp.vtt'), 'vtt');
    $flags = $detector->detect($transcript);

    expect($flags)->not->toBeEmpty();
    expect(collect($flags)->pluck('type'))->toContain('interview_prompt');
    expect(collect($flags)->contains(fn (array $flag): bool => ($flag['severity'] ?? '') === 'critical'))->toBeTrue();
});

test('honest vtt fixture does not trigger live prompt integrity flags', function () {
    $parser = app(CaptionFileParser::class);
    $detector = new TranscriptIntegritySignalDetector;

    $transcript = $parser->parseContents(FixtureLoader::read('honest.vtt'), 'vtt');

    expect($detector->detect($transcript))->toBeEmpty();
});

test('transcript flags cap suspicious interview scores below high integrity threshold', function () {
    $parser = app(CaptionFileParser::class);
    $detector = new TranscriptIntegritySignalDetector;
    $reconciler = new IntegrityEvaluationReconciler;
    $calculator = new IntegrityScoreCalculator;

    $transcript = $parser->parseContents(FixtureLoader::read('susp.vtt'), 'vtt');
    $flags = $detector->detect($transcript);

    $evaluation = $reconciler->reconcile([
        's_cv' => ['score' => 82, 'summary' => 'CV appears coherent.'],
        's_int' => ['score' => 85, 'summary' => 'Strong technical depth.'],
        's_cross' => [
            'score' => null,
            'summary' => 'No profiles submitted.',
            'confidence_band' => 'not-evaluated',
        ],
        's_id' => ['score' => 80, 'summary' => 'Identity signals acceptable.'],
        'flags' => $flags,
        'round_analyses' => [],
    ], hasExternalProfiles: false);

    $score = $calculator->calculate(
        $calculator->scoreComponentsFromEvaluation($evaluation),
    );

    expect($evaluation['s_int']['score'])->toBeLessThanOrEqual(40.0);
    expect($score)->toBeLessThan(75.0);
});
