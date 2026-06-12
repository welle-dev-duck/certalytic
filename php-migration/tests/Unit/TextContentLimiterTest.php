<?php

use App\Services\TextContentLimiter;

test('limits cv text to configured word and character caps', function () {
    config()->set('certalytic.limits.cv_text_max_words', 5);
    config()->set('certalytic.limits.cv_text_max_characters', 20);

    $result = (new TextContentLimiter)->limitCvText('one two three four five six seven');

    expect($result['was_truncated'])->toBeTrue();
    expect($result['text'])->toBe('one two three four f');
});

test('limits transcript text to configured caps', function () {
    config()->set('certalytic.limits.transcript_text_max_words', 3);
    config()->set('certalytic.limits.transcript_text_max_characters', 100);

    $result = (new TextContentLimiter)->limitTranscriptText('alpha beta gamma delta');

    expect($result['was_truncated'])->toBeTrue();
    expect($result['text'])->toBe('alpha beta gamma');
});
