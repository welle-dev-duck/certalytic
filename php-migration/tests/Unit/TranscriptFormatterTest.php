<?php

use App\Services\TranscriptFormatter;

test('format segments prefixes each line with speaker label', function () {
    $formatter = new TranscriptFormatter;

    $segments = [
        ['speaker_id' => 'speaker_0', 'text' => 'Hello there.', 'start' => 0.0, 'end' => 1.2],
        ['speaker_id' => 'speaker_1', 'text' => 'Thanks for having me.', 'start' => 1.3, 'end' => 3.0],
    ];

    $labels = [
        'speaker_0' => 'Hans',
        'speaker_1' => 'Candidate',
    ];

    $text = $formatter->formatSegments($segments, $labels);

    expect($text)->toBe("Hans: Hello there.\nCandidate: Thanks for having me.");
});

test('build default speaker labels assigns speaker numbers', function () {
    $formatter = new TranscriptFormatter;

    $segments = [
        ['speaker_id' => 'speaker_0', 'text' => 'One', 'start' => null, 'end' => null],
        ['speaker_id' => 'speaker_1', 'text' => 'Two', 'start' => null, 'end' => null],
    ];

    $labels = $formatter->buildDefaultSpeakerLabels($segments);

    expect($labels)->toBe([
        'speaker_0' => 'Speaker 1',
        'speaker_1' => 'Speaker 2',
    ]);
});

test('normalize segments skips empty text and assigns default speaker id', function () {
    $formatter = new TranscriptFormatter;

    $normalized = $formatter->normalizeSegments([
        ['text' => '  Valid line  '],
        ['text' => ''],
        ['speaker_id' => 'speaker_2', 'text' => 'Another', 'start' => '1.5', 'end' => '3.2'],
    ]);

    expect($normalized)->toBe([
        ['speaker_id' => 'speaker_0', 'text' => 'Valid line', 'start' => null, 'end' => null],
        ['speaker_id' => 'speaker_2', 'text' => 'Another', 'start' => 1.5, 'end' => 3.2],
    ]);
});

test('format segments can include timestamps', function () {
    $formatter = new TranscriptFormatter;

    $segments = [
        ['speaker_id' => 'speaker_0', 'text' => 'Opening.', 'start' => 0.0, 'end' => 2.5],
    ];

    $text = $formatter->formatSegments($segments, ['speaker_0' => 'Interviewer'], true);

    expect($text)->toBe('[0s–2.5s] Interviewer: Opening.');
});
