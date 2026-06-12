<?php

namespace App\Services\Mistral;

use App\Contracts\CandidateEvaluator;
use App\DataTransferObjects\RoleContext;

class MistralCandidateEvaluator implements CandidateEvaluator
{
    public function __construct(private MistralClient $client) {}

    /**
     * {@inheritdoc}
     */
    public function evaluate(
        string $cvText,
        array $rounds,
        array $publicProfiles,
        bool $includeCrossSource,
        ?string $role = null,
        ?string $jobDescription = null,
        ?RoleContext $roleContext = null,
    ): array {
        $context = $roleContext ?? new RoleContext(title: $role, description: $jobDescription);

        $response = $this->client->chat([
            'model' => config('certalytic.mistral.chat_model'),
            'temperature' => 0.2,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $this->systemPrompt($context),
                ],
                [
                    'role' => 'user',
                    'content' => json_encode([
                        'role_context' => $context->toPromptArray(),
                        'cv_text' => $cvText,
                        'merged_transcript' => $rounds[0]['transcript'] ?? '',
                        'interviewer_notes' => $rounds[0]['interviewer_notes'] ?? null,
                        'was_truncated' => (bool) ($rounds[0]['was_truncated'] ?? false),
                        'public_profiles' => $publicProfiles,
                        'include_cross_source' => $includeCrossSource,
                    ], JSON_THROW_ON_ERROR),
                ],
            ],
        ]);

        $content = $response['choices'][0]['message']['content'] ?? null;

        if (! is_string($content) || $content === '') {
            throw new \RuntimeException('Mistral returned an empty evaluation response.');
        }

        /** @var array<string, mixed> $decoded */
        $decoded = json_decode($content, true, flags: JSON_THROW_ON_ERROR);

        return $this->normalizeEvaluation($decoded, $includeCrossSource);
    }

    private function systemPrompt(RoleContext $context): string
    {
        $title = $context->title ?? 'Unspecified role';
        $description = $context->description ?? 'No job description provided.';
        $hasScanAssets = $context->scanAssets !== [];

        $scanInstructions = $hasScanAssets
            ? 'Targeted scan assets are provided. Cross-reference interview transcripts for verbatim matches, leaked test parameters, or suspiciously aligned phrasing against those assets.'
            : 'No targeted scan assets were provided for this role.';

        return <<<PROMPT
You are Certalytic's decision support integrity screening engine for recruitment.

Analyze the candidate for the role of: {$title}.

[Role Context / Job Description]
{$description}

{$scanInstructions}

Calibrate expectations to this role's seniority and domain. Communication that appears rehearsed or highly structured may be normal for senior technical leadership roles but suspicious for junior roles - use role context.

Score each integrity component (s_cv, s_int, s_cross, s_id) from 0 to 100 as heuristic confidence bands (not guilt/innocence verdicts).
Use neutral, probabilistic language only: integrity indicators, signal density, follow-up suggested, inconsistency flagged, may suggest, could indicate.
Never use hire/reject directives or pass/fail framing (no "proceed", "do not advance", "hire", "reject", "pass", "fail", "cheating detected", or "authenticity confirmed").
Summaries and observations describe evidence and confidence - they do not tell recruiters whether to advance or reject a candidate.

Also produce supplementary behaviour_analysis and personality_analysis sections from the merged transcript and CV.
These supplementary sections are for hiring-manager context only - they MUST NOT influence s_cv, s_int, s_cross, s_id scores, flags, or round_analyses integrity scoring.
Do not output numeric scores inside behaviour_analysis or personality_analysis.

[Merged Transcript Analysis Instructions]
You are evaluating a single, merged transcript file that may contain multiple distinct interview stages (e.g., a technical screening followed by a behavioral round). 
- Treat bracketed stage directions such as "[Long Pause]", "[Pause - keyboard typing]", or "[Extended Pause]" as first-class integrity evidence, not formatting noise.
- Identify stylistic shifts and internal variance across this single document. 
- Contrast the candidate's communication nuance in spontaneous, behavioral, or cultural sections against highly structured, textbook-style prose in technical sections.
- When pauses, typing sounds, or latency gaps precede polished numbered-list answers, lower s_int and raise interview_prompt flags with cited evidence.
- If the document contains distinct phases, evaluate them sequentially and populate the "round_analyses" array accordingly (use round_number 1, 2, etc., for the sequential segments you identify).

Optional interviewer_notes are private recruiter observations that are NOT candidate speech. Treat these as high-signal evidence for live LLM/prompt assistance (latency gaps, typing artifacts, verbatim question echo, speech pivot into formal prose). Cite specific evidence in observations.

When public_profiles include linkedin_url or linkedin_text, cross-reference against the CV. When github_username is present, cross-reference repository activity vs claimed experience. If a platform was not provided, set its matrix score to null and explain that it was not evaluated - never invent a percentage.

Return this exact JSON shape:
{
  "s_cv": {"score": number, "summary": string, "indicators": [string], "confidence_band": string},
  "s_int": {"score": number, "summary": string, "indicators": [string], "confidence_band": string},
  "s_cross": {"score": number, "summary": string, "indicators": [string], "confidence_band": string},
  "s_id": {"score": number, "summary": string, "indicators": [string], "confidence_band": string},
  "follow_up_suggested": [string],
  "anomalies": [string],
  "round_analyses": [{"round_number": number, "s_int": number, "s_id": number, "observations": [string], "anomalies": [string], "deep_dive_prompts": [string]}],
  "flags": [{"type": "ai_text"|"platform_mismatch"|"synthetic_profile"|"interview_prompt", "severity": "info"|"warning"|"critical", "description": string, "confidence": number}],
  "platform_matrix": {
    "linkedin_cv_match": {"score": number|null, "explanation": string},
    "github_experience_match": {"score": number|null, "explanation": string},
    "cross_platform_consistency": {"score": number|null, "explanation": string}
  },
  "behaviour_analysis": {
    "summary": string,
    "traits": [string],
    "communication_style": string,
    "collaboration_indicators": [string],
    "concerns": [string]
  },
  "personality_analysis": {
    "summary": string,
    "traits": [string],
    "motivation_signals": [string],
    "work_style": string,
    "culture_fit_indicators": [string]
  }
}

Every flag description MUST cite the specific evidence (e.g. "31-second gap before answer", "no LinkedIn submitted", "CV bullet X vs profile Y").
Component scores and flags MUST be internally consistent: if you raise interview_prompt or ai_text flags about interview authenticity, s_int and round_analyses s_int MUST be <= 55 (<= 40 for critical). If you raise ai_text flags about CV wording only, s_cv MUST reflect that penalty. Do not praise authentic interview signal in round observations while simultaneously flagging live-prompt or synthetic-response indicators for the same segment.
If no LinkedIn or GitHub profiles were submitted, do NOT emit a platform_mismatch flag - use severity "info" and explain that cross-validation was skipped. Set s_cross score to null with confidence_band "not-evaluated", summary explaining that platform checks were skipped, and platform_matrix scores to null with explanations. Skipped cross-source checks must not inflate the hiring integrity score.
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $decoded
     * @return array<string, mixed>
     */
    private function normalizeEvaluation(array $decoded, bool $includeCrossSource): array
    {
        return [
            's_cv' => $this->normalizeComponent($decoded['s_cv'] ?? [], 50.0),
            's_int' => $this->normalizeComponent($decoded['s_int'] ?? [], 50.0),
            's_cross' => $includeCrossSource
                ? $this->normalizeComponent($decoded['s_cross'] ?? [], 50.0)
                : [
                    'score' => null,
                    'summary' => 'No LinkedIn or GitHub profiles were submitted, so platform cross-reference was not performed.',
                    'indicators' => ['Platform checks skipped - insufficient external profile data.'],
                    'confidence_band' => 'not-evaluated',
                ],
            's_id' => $this->normalizeComponent($decoded['s_id'] ?? [], 50.0),
            'follow_up_suggested' => array_values(array_filter(
                is_array($decoded['follow_up_suggested'] ?? null) ? $decoded['follow_up_suggested'] : [],
                fn ($item) => is_string($item) && $item !== '',
            )),
            'anomalies' => array_values(array_filter(
                is_array($decoded['anomalies'] ?? null) ? $decoded['anomalies'] : [],
                fn ($item) => is_string($item) && $item !== '',
            )),
            'round_analyses' => $this->normalizeRoundAnalyses($decoded['round_analyses'] ?? []),
            'flags' => $this->normalizeFlags($decoded['flags'] ?? []),
            'platform_matrix' => $this->normalizePlatformMatrix(
                is_array($decoded['platform_matrix'] ?? null) ? $decoded['platform_matrix'] : [],
                $includeCrossSource,
            ),
            'behaviour_analysis' => $this->normalizeSupplementaryAnalysis($decoded['behaviour_analysis'] ?? null),
            'personality_analysis' => $this->normalizeSupplementaryAnalysis($decoded['personality_analysis'] ?? null, true),
        ];
    }

    /**
     * @return array{summary: string, traits: list<string>, detail_label: string, detail: string, indicators: list<string>, motivation_signals: list<string>, concerns: list<string>}
     */
    private function normalizeSupplementaryAnalysis(mixed $analysis, bool $personality = false): array
    {
        if (! is_array($analysis)) {
            return [
                'summary' => 'Supplementary analysis was not available for this screening.',
                'traits' => [],
                'detail_label' => $personality ? 'Work style' : 'Communication style',
                'detail' => 'Not assessed.',
                'indicators' => [],
                'motivation_signals' => [],
                'concerns' => [],
            ];
        }

        $detailKey = $personality ? 'work_style' : 'communication_style';
        $indicatorKey = $personality ? 'culture_fit_indicators' : 'collaboration_indicators';

        return [
            'summary' => is_string($analysis['summary'] ?? null)
                ? $analysis['summary']
                : 'No supplementary summary provided.',
            'traits' => $this->stringList($analysis['traits'] ?? []),
            'detail_label' => $personality ? 'Work style' : 'Communication style',
            'detail' => is_string($analysis[$detailKey] ?? null)
                ? $analysis[$detailKey]
                : 'Not assessed.',
            'indicators' => $this->stringList($analysis[$indicatorKey] ?? []),
            'motivation_signals' => $personality
                ? $this->stringList($analysis['motivation_signals'] ?? [])
                : [],
            'concerns' => $this->stringList($analysis['concerns'] ?? []),
        ];
    }

    /**
     * @return list<string>
     */
    private function stringList(mixed $values): array
    {
        if (! is_array($values)) {
            return [];
        }

        return array_values(array_filter(
            $values,
            fn ($item) => is_string($item) && $item !== '',
        ));
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function normalizeRoundAnalyses(mixed $roundAnalyses): array
    {
        if (! is_array($roundAnalyses)) {
            return [];
        }

        $normalized = [];

        foreach ($roundAnalyses as $round) {
            if (! is_array($round)) {
                continue;
            }

            $normalized[] = [
                'round_number' => (int) ($round['round_number'] ?? 0),
                's_int' => max(0, min(100, (float) ($round['s_int'] ?? 50))),
                's_id' => max(0, min(100, (float) ($round['s_id'] ?? 50))),
                'observations' => array_values(array_filter(
                    is_array($round['observations'] ?? null) ? $round['observations'] : [],
                    fn ($item) => is_string($item) && $item !== '',
                )),
                'anomalies' => array_values(array_filter(
                    is_array($round['anomalies'] ?? null) ? $round['anomalies'] : [],
                    fn ($item) => is_string($item) && $item !== '',
                )),
                'deep_dive_prompts' => array_values(array_filter(
                    is_array($round['deep_dive_prompts'] ?? null) ? $round['deep_dive_prompts'] : [],
                    fn ($item) => is_string($item) && $item !== '',
                )),
            ];
        }

        return $normalized;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function normalizeFlags(mixed $flags): array
    {
        if (! is_array($flags)) {
            return [];
        }

        $normalized = [];

        foreach ($flags as $flag) {
            if (! is_array($flag) || ! is_string($flag['description'] ?? null)) {
                continue;
            }

            $normalized[] = [
                'type' => is_string($flag['type'] ?? null) ? $flag['type'] : 'interview_prompt',
                'severity' => is_string($flag['severity'] ?? null) ? $flag['severity'] : 'warning',
                'description' => $flag['description'],
                'confidence' => is_numeric($flag['confidence'] ?? null)
                    ? max(0, min(1, (float) $flag['confidence']))
                    : 0.75,
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $matrix
     * @return array<string, array{score: int|null, explanation: string}>
     */
    private function normalizePlatformMatrix(array $matrix, bool $includeCrossSource): array
    {
        if (! $includeCrossSource) {
            return [
                'linkedin_cv_match' => [
                    'score' => null,
                    'explanation' => 'No LinkedIn or GitHub profiles were submitted, so platform cross-reference was not performed.',
                ],
                'github_experience_match' => [
                    'score' => null,
                    'explanation' => 'No GitHub profile was submitted.',
                ],
                'cross_platform_consistency' => [
                    'score' => null,
                    'explanation' => 'Cross-platform consistency requires external profile URLs.',
                ],
            ];
        }

        return [
            'linkedin_cv_match' => $this->normalizeMatrixRow($matrix['linkedin_cv_match'] ?? null),
            'github_experience_match' => $this->normalizeMatrixRow($matrix['github_experience_match'] ?? null),
            'cross_platform_consistency' => $this->normalizeMatrixRow($matrix['cross_platform_consistency'] ?? null),
        ];
    }

    /**
     * @return array{score: int|null, explanation: string}
     */
    private function normalizeMatrixRow(mixed $row): array
    {
        if (! is_array($row)) {
            return ['score' => null, 'explanation' => 'Not evaluated.'];
        }

        $score = $row['score'] ?? null;

        return [
            'score' => is_numeric($score) ? (int) max(0, min(100, round((float) $score))) : null,
            'explanation' => is_string($row['explanation'] ?? null)
                ? $row['explanation']
                : 'No explanation provided.',
        ];
    }

    /**
     * @param  array<string, mixed>  $component
     * @return array{score: float, summary: string, indicators: array<int, string>, confidence_band: string}
     */
    private function normalizeComponent(array $component, float $defaultScore): array
    {
        $score = is_numeric($component['score'] ?? null)
            ? (float) $component['score']
            : $defaultScore;

        $indicators = array_values(array_filter(
            is_array($component['indicators'] ?? null) ? $component['indicators'] : [],
            fn ($item) => is_string($item) && $item !== '',
        ));

        return [
            'score' => max(0, min(100, $score)),
            'summary' => is_string($component['summary'] ?? null) ? $component['summary'] : 'No summary provided.',
            'indicators' => $indicators !== [] ? $indicators : ['Signal density within expected range for role level.'],
            'confidence_band' => is_string($component['confidence_band'] ?? null)
                ? $component['confidence_band']
                : ($score >= 70 ? 'moderate-high' : 'moderate'),
        ];
    }
}
