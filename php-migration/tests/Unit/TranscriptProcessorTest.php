<?php

use App\Services\TranscriptProcessor;

test('smart truncate preserves structure', function () {
    $processor = new TranscriptProcessor;

    $lines = ["Opening intro line\n"];
    for ($i = 0; $i < 8000; $i++) {
        $lines[] = "filler line {$i}\n";
    }
    $lines[] = "Interviewer: Final question?\n";
    $lines[] = "Candidate: Final answer.\n";
    $lines[] = "Closing remarks.\n";

    $text = implode('', $lines);
    $result = $processor->process($text);

    expect($result['was_truncated'])->toBeTrue();
    expect($result['text'])->toContain('Interviewer: Final question?');
});
