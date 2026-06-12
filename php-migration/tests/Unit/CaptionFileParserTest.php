<?php

use App\Services\CaptionFileParser;
use App\Services\LocalCvReader;
use App\Services\Storage\SignedStorageUrlService;

test('parses vtt caption files into plain transcript text', function () {
    $parser = new CaptionFileParser(new LocalCvReader, app(SignedStorageUrlService::class));

    $vtt = <<<'VTT'
WEBVTT

00:00:01.000 --> 00:00:04.000
Interviewer: Tell me about your experience.

00:00:05.000 --> 00:00:08.000
Candidate: I built distributed systems.
VTT;

    $text = $parser->parseContents($vtt, 'vtt');

    expect($text)->toContain('Interviewer: Tell me about your experience.');
    expect($text)->toContain('Candidate: I built distributed systems.');
});
