<?php

use App\Services\LocalCvReader;
use App\Services\Mistral\MistralCandidateEvaluator;
use App\Services\Mistral\MistralClient;
use Illuminate\Support\Facades\Http;

test('local cv reader extracts docx text', function () {
    $reader = new LocalCvReader;

    $path = sys_get_temp_dir().'/certalytic-test.docx';
    $zip = new ZipArchive;
    $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    $zip->addFromString('word/document.xml', '<w:document><w:body><w:p><w:r><w:t>Jane Doe CV</w:t></w:r></w:p></w:body></w:document>');
    $zip->close();

    expect($reader->readDocx($path))->toContain('Jane Doe CV');

    unlink($path);
});

test('mistral candidate evaluator parses structured json response', function () {
    config([
        'certalytic.mistral.api_key' => 'test-key',
        'certalytic.mistral.chat_model' => 'mistral-small-latest',
    ]);

    Http::fake([
        'api.mistral.ai/v1/chat/completions' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'content' => json_encode([
                            's_cv' => ['score' => 80, 'summary' => 'CV ok', 'indicators' => ['Stable timeline'], 'confidence_band' => 'moderate-high'],
                            's_int' => ['score' => 75, 'summary' => 'Interview ok', 'indicators' => ['Consistent depth'], 'confidence_band' => 'moderate-high'],
                            's_cross' => ['score' => 70, 'summary' => 'Cross ok', 'indicators' => ['Profiles align'], 'confidence_band' => 'moderate'],
                            's_id' => ['score' => 85, 'summary' => 'Identity ok', 'indicators' => ['Consistent identity'], 'confidence_band' => 'moderate-high'],
                            'follow_up_suggested' => ['Ask about production incident.'],
                            'anomalies' => [],
                        ]),
                    ],
                ],
            ],
        ]),
    ]);

    $evaluator = new MistralCandidateEvaluator(new MistralClient);

    $result = $evaluator->evaluate(
        cvText: 'Jane Doe senior engineer',
        rounds: [['round_number' => 1, 'transcript' => 'Interviewer: Hi', 'was_truncated' => false]],
        publicProfiles: ['linkedin_url' => null, 'github_username' => null],
        includeCrossSource: true,
        role: 'Senior Engineer',
        jobDescription: 'Build Laravel systems',
    );

    expect($result['s_cv']['score'])->toBe(80.0);
    expect($result['follow_up_suggested'])->toContain('Ask about production incident.');
});
