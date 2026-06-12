<?php

namespace Tests\Fixtures;

use Illuminate\Support\Facades\Http;

class MistralHttpFakes
{
    /**
     * @param  array<string, mixed>  $chatResponse
     */
    public static function fake(array $chatResponse, string $ocrMarkdown = 'Jane Doe - Software Engineer'): void
    {
        Http::fake([
            'api.mistral.ai/v1/ocr' => Http::response([
                'pages' => [
                    ['markdown' => $ocrMarkdown],
                ],
            ]),
            'api.mistral.ai/v1/chat/completions' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'content' => json_encode($chatResponse, JSON_THROW_ON_ERROR),
                        ],
                    ],
                ],
            ]),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function minimalEvaluation(int $roundNumber = 1): array
    {
        return [
            's_cv' => [
                'score' => 80,
                'summary' => 'CV aligns with role expectations.',
                'indicators' => ['Concrete project history provided.'],
                'confidence_band' => 'high',
            ],
            's_int' => [
                'score' => 75,
                'summary' => 'Interview responses are specific and consistent.',
                'indicators' => ['Answers include trade-offs and metrics.'],
                'confidence_band' => 'high',
            ],
            's_cross' => [
                'score' => 70,
                'summary' => 'Cross-source signals are broadly consistent.',
                'indicators' => ['No major timeline conflicts detected.'],
                'confidence_band' => 'moderate',
            ],
            's_id' => [
                'score' => 85,
                'summary' => 'Identity signals appear coherent.',
                'indicators' => ['Communication style is stable across rounds.'],
                'confidence_band' => 'high',
            ],
            'follow_up_suggested' => [],
            'anomalies' => [],
            'round_analyses' => [
                [
                    'round_number' => $roundNumber,
                    's_int' => 75,
                    's_id' => 85,
                    'observations' => ['Candidate explained decisions with specifics.'],
                    'anomalies' => [],
                    'deep_dive_prompts' => [],
                ],
            ],
            'flags' => [],
            'platform_matrix' => [
                'linkedin_cv_match' => [
                    'score' => null,
                    'explanation' => 'No LinkedIn profile was submitted.',
                ],
                'github_experience_match' => [
                    'score' => null,
                    'explanation' => 'No GitHub profile was submitted.',
                ],
                'cross_platform_consistency' => [
                    'score' => null,
                    'explanation' => 'Cross-platform consistency requires external profile URLs.',
                ],
            ],
        ];
    }
}
