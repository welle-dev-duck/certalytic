<?php

use App\Services\TranscriptMerger;

test('transcript merger combines multiple segments with separators', function () {
    $merged = (new TranscriptMerger)->merge([
        'Round one transcript',
        'Round two transcript',
    ]);

    expect($merged)->toContain('--- Interview transcript 1 ---')
        ->toContain('Round one transcript')
        ->toContain('--- Interview transcript 2 ---')
        ->toContain('Round two transcript');
});

test('transcript merger returns single segment unchanged', function () {
    $merged = (new TranscriptMerger)->merge([
        'Only one transcript',
    ]);

    expect($merged)->toBe('Only one transcript');
});
