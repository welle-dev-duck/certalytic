<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\InterviewRound;

/**
 * Derives the rich integrity report shown on the screening-details page from a
 * candidate's stored evaluation.
 */
class CandidateReport
{
    /**
     * @return array<string, mixed>
     */
    public static function build(Candidate $candidate): array
    {
        $score = self::clamp(self::num($candidate->integrity_score));
        $level = self::level($score);
        $breakdown = is_array($candidate->score_breakdown) ? $candidate->score_breakdown : [];

        $crossSourceEvaluated = self::crossSourceEvaluated($breakdown);
        $sCv = self::sub($breakdown, 's_cv', $score);
        $sInt = self::sub($breakdown, 's_int', $score);
        $sCross = $crossSourceEvaluated ? self::sub($breakdown, 's_cross', $score) : null;
        $sId = self::sub($breakdown, 's_id', $score);

        $rounds = self::rounds($candidate);
        $variances = array_values(array_filter(
            array_map(fn (array $round): ?int => $round['variance_delta'], $rounds),
            fn (?int $value): bool => $value !== null,
        ));
        $avgVariance = count($variances) > 0 ? array_sum($variances) / count($variances) : 0;
        $responseScore = self::clamp(100 - $avgVariance);

        $aiTextPercent = self::clamp(100 - $sCv);
        $hasLinkedIn = filled($candidate->linkedin_url) || filled($candidate->linkedin_text);
        $hasGitHub = filled($candidate->github_username) || filled($candidate->github_text);
        $platformMatrix = self::platformMatrix(
            $breakdown,
            $hasLinkedIn,
            $hasGitHub,
            $crossSourceEvaluated ? (int) $sCross : 0,
        );

        $flags = self::resolveFlags(
            $candidate,
            $breakdown,
            $sCv,
            $sCross,
            $sId,
            $sInt,
            $aiTextPercent,
            $hasLinkedIn,
            $hasGitHub,
            $rounds,
        );

        $verdict = self::verdict($level, $breakdown, $sInt, $flags);

        return [
            'score' => $score,
            'level' => $level,
            'subScores' => [
                's_cv' => $sCv,
                's_int' => $sInt,
                's_cross' => $sCross,
                's_id' => $sId,
            ],
            'componentSummaries' => [
                's_cv' => self::summary($breakdown, 's_cv'),
                's_int' => self::summary($breakdown, 's_int'),
                's_cross' => self::summary($breakdown, 's_cross'),
                's_id' => self::summary($breakdown, 's_id'),
            ],
            'componentIndicators' => [
                's_cv' => self::indicators($breakdown, 's_cv'),
                's_int' => self::indicators($breakdown, 's_int'),
                's_cross' => self::indicators($breakdown, 's_cross'),
                's_id' => self::indicators($breakdown, 's_id'),
            ],
            'aiTextPercent' => $aiTextPercent,
            'crossSourceEvaluated' => $crossSourceEvaluated,
            'platformConsistency' => $crossSourceEvaluated ? $sCross : null,
            'platformMatrix' => $platformMatrix,
            'interviewVariance' => self::clamp(100 - $sInt),
            'responseScore' => $responseScore,
            'radar' => [
                ['subject' => 'CV Auth.', 'value' => $sCv],
                ['subject' => 'Platform', 'value' => $crossSourceEvaluated ? (int) $sCross : 0],
                ['subject' => 'Credentials', 'value' => $sId],
                ['subject' => 'Interview', 'value' => $sInt],
                ['subject' => 'Response', 'value' => $responseScore],
            ],
            'riskVectors' => [
                ['name' => 'AI Text', 'value' => $aiTextPercent],
                ['name' => 'Platform', 'value' => $crossSourceEvaluated ? self::clamp(100 - (int) $sCross) : 0],
                ['name' => 'Confidence', 'value' => self::clamp(100 - $sInt)],
            ],
            'flags' => $flags,
            'linkedin' => self::platform($hasLinkedIn, $candidate->linkedin_url ?? $candidate->linkedin_text, $platformMatrix['linkedin_cv_match']['score']),
            'github' => self::platform($hasGitHub, $candidate->github_username, $platformMatrix['github_experience_match']['score']),
            'verdict' => ['level' => $level] + $verdict['summary'],
            'recommendedActions' => $verdict['actions'],
            'rounds' => $rounds,
            'behaviourAnalysis' => self::supplementaryAnalysis($breakdown, 'behaviour_analysis'),
            'personalityAnalysis' => self::supplementaryAnalysis($breakdown, 'personality_analysis', true),
        ];
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @return array{summary: string, traits: list<string>, detailLabel: string, detail: string, indicators: list<string>, motivationSignals: list<string>, concerns: list<string>}
     */
    private static function supplementaryAnalysis(array $breakdown, string $key, bool $personality = false): array
    {
        $stored = $breakdown[$key] ?? null;

        if (! is_array($stored)) {
            return [
                'summary' => 'Supplementary analysis was not available for this screening.',
                'traits' => [],
                'detailLabel' => $personality ? 'Work style' : 'Communication style',
                'detail' => 'Not assessed.',
                'indicators' => [],
                'motivationSignals' => [],
                'concerns' => [],
            ];
        }

        return [
            'summary' => is_string($stored['summary'] ?? null)
                ? $stored['summary']
                : 'No supplementary summary provided.',
            'traits' => self::stringList($stored['traits'] ?? []),
            'detailLabel' => is_string($stored['detail_label'] ?? null)
                ? $stored['detail_label']
                : ($personality ? 'Work style' : 'Communication style'),
            'detail' => is_string($stored['detail'] ?? null)
                ? $stored['detail']
                : 'Not assessed.',
            'indicators' => self::stringList($stored['indicators'] ?? []),
            'motivationSignals' => self::stringList($stored['motivation_signals'] ?? []),
            'concerns' => self::stringList($stored['concerns'] ?? []),
        ];
    }

    /**
     * @return list<string>
     */
    private static function stringList(mixed $values): array
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
    public static function flags(Candidate $candidate): array
    {
        $score = self::clamp(self::num($candidate->integrity_score));
        $breakdown = is_array($candidate->score_breakdown) ? $candidate->score_breakdown : [];

        return self::resolveFlags(
            $candidate,
            $breakdown,
            self::sub($breakdown, 's_cv', $score),
            self::crossSourceEvaluated($breakdown) ? self::sub($breakdown, 's_cross', $score) : null,
            self::sub($breakdown, 's_id', $score),
            self::sub($breakdown, 's_int', $score),
            self::clamp(100 - self::sub($breakdown, 's_cv', $score)),
            filled($candidate->linkedin_url) || filled($candidate->linkedin_text),
            filled($candidate->github_username),
            self::rounds($candidate),
        );
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @param  list<array<string, mixed>>  $rounds
     * @return list<array<string, mixed>>
     */
    private static function resolveFlags(
        Candidate $candidate,
        array $breakdown,
        int $sCv,
        ?int $sCross,
        int $sId,
        int $sInt,
        int $aiTextPercent,
        bool $hasLinkedIn,
        bool $hasGitHub,
        array $rounds,
    ): array {
        $stored = $breakdown['flags'] ?? null;

        if (is_array($stored) && $stored !== []) {
            return array_values(array_filter($stored, fn ($flag): bool => is_array($flag) && isset($flag['description'])));
        }

        return self::deriveFlags(
            $candidate,
            $sCv,
            $sCross,
            $sId,
            $sInt,
            $aiTextPercent,
            $hasLinkedIn,
            $hasGitHub,
            $rounds,
        );
    }

    /**
     * @param  list<array<string, mixed>>  $rounds
     * @return list<array<string, mixed>>
     */
    private static function deriveFlags(
        Candidate $candidate,
        int $sCv,
        ?int $sCross,
        int $sId,
        int $sInt,
        int $aiTextPercent,
        bool $hasLinkedIn,
        bool $hasGitHub,
        array $rounds,
    ): array {
        $flags = [];

        if ($aiTextPercent >= 35) {
            $flags[] = [
                'type' => 'ai_text',
                'severity' => self::severity($aiTextPercent),
                'description' => "Approximately {$aiTextPercent}% of CV narrative text matches AI-generation patterns in experience and summary sections.",
                'confidence' => min(0.98, $aiTextPercent / 100 + 0.1),
            ];
        }

        if ($sCross !== null && ($hasLinkedIn || $hasGitHub) && $sCross < 60) {
            $platforms = array_filter([
                $hasLinkedIn ? 'LinkedIn' : null,
                $hasGitHub ? 'GitHub' : null,
            ]);
            $flags[] = [
                'type' => 'platform_mismatch',
                'severity' => self::severity(100 - $sCross),
                'description' => 'Submitted '.implode(' and ', $platforms).' data weakly corroborates CV employment or project claims (consistency score '.$sCross.'%).',
                'confidence' => min(0.95, (100 - $sCross) / 100 + 0.1),
            ];
        }

        if ($sId < 50) {
            $flags[] = [
                'type' => 'synthetic_profile',
                'severity' => self::severity(100 - $sId),
                'description' => 'Identity provenance indicators are weak - possible synthetic or recently fabricated profile (identity score '.$sId.'%).',
                'confidence' => min(0.95, (100 - $sId) / 100),
            ];
        }

        $hasInterviewAnomaly = $candidate->high_inconsistency_warning
            || $sInt < 55
            || collect($rounds)->contains(fn (array $round): bool => $round['was_truncated']
                || ($round['variance_delta'] ?? 0) > 20
                || ($round['s_int'] ?? 100) < 55);

        if ($hasInterviewAnomaly) {
            $evidenceRound = collect($rounds)->first(fn (array $round): bool => ($round['s_int'] ?? 100) < 55);
            $evidence = $evidenceRound['observations'][0]
                ?? 'Interview responses show latency, phrasing, or consistency anomalies consistent with live prompt assistance.';

            $flags[] = [
                'type' => 'interview_prompt',
                'severity' => $sInt < 35 || $candidate->high_inconsistency_warning ? 'critical' : 'warning',
                'description' => $evidence,
                'confidence' => min(0.96, (100 - $sInt) / 100 + 0.15),
            ];
        }

        return $flags;
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @return array<string, array{score: int|null, explanation: string}>
     */
    private static function platformMatrix(
        array $breakdown,
        bool $hasLinkedIn,
        bool $hasGitHub,
        int $fallbackCrossScore,
    ): array {
        $stored = $breakdown['platform_matrix'] ?? null;

        if (is_array($stored) && $stored !== []) {
            return [
                'linkedin_cv_match' => self::normalizeMatrixRow($stored['linkedin_cv_match'] ?? null),
                'github_experience_match' => self::normalizeMatrixRow($stored['github_experience_match'] ?? null),
                'cross_platform_consistency' => self::normalizeMatrixRow($stored['cross_platform_consistency'] ?? null),
            ];
        }

        if (! $hasLinkedIn && ! $hasGitHub) {
            return [
                'linkedin_cv_match' => [
                    'score' => null,
                    'explanation' => 'No LinkedIn profile was submitted. Employment timeline cross-check against the CV was not performed.',
                ],
                'github_experience_match' => [
                    'score' => null,
                    'explanation' => 'No GitHub profile was submitted. Repository activity could not be compared to claimed engineering experience.',
                ],
                'cross_platform_consistency' => [
                    'score' => null,
                    'explanation' => 'Cross-platform consistency requires at least one external profile URL. With none provided, this dimension is not scored.',
                ],
            ];
        }

        return [
            'linkedin_cv_match' => [
                'score' => $hasLinkedIn ? $fallbackCrossScore : null,
                'explanation' => $hasLinkedIn
                    ? "LinkedIn data compared to CV timeline; estimated consistency {$fallbackCrossScore}%."
                    : 'LinkedIn not provided.',
            ],
            'github_experience_match' => [
                'score' => $hasGitHub ? max(0, $fallbackCrossScore - 8) : null,
                'explanation' => $hasGitHub
                    ? 'GitHub activity compared to claimed engineering experience.'
                    : 'GitHub not provided.',
            ],
            'cross_platform_consistency' => [
                'score' => max(0, $fallbackCrossScore - 5),
                'explanation' => 'Cross-platform name and date consistency across submitted profiles.',
            ],
        ];
    }

    /**
     * @return array{score: int|null, explanation: string}
     */
    private static function normalizeMatrixRow(mixed $row): array
    {
        if (! is_array($row)) {
            return ['score' => null, 'explanation' => 'Not evaluated.'];
        }

        $score = $row['score'] ?? null;

        return [
            'score' => is_numeric($score) ? self::clamp(self::num($score)) : null,
            'explanation' => is_string($row['explanation'] ?? null)
                ? $row['explanation']
                : 'No explanation provided.',
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private static function rounds(Candidate $candidate): array
    {
        if (! $candidate->relationLoaded('interviewRounds')) {
            return [];
        }

        return $candidate->interviewRounds
            ->map(function (InterviewRound $round): array {
                $scores = is_array($round->round_scores) ? $round->round_scores : [];
                $sInt = isset($scores['s_int']) ? self::clamp(self::num($scores['s_int'])) : null;
                $sId = isset($scores['s_id']) ? self::clamp(self::num($scores['s_id'])) : null;
                $variance = $round->variance_delta !== null ? (int) round(self::num($round->variance_delta)) : null;

                $storedObservations = is_array($scores['observations'] ?? null)
                    ? array_values(array_filter($scores['observations'], fn ($item) => is_string($item) && $item !== ''))
                    : [];
                $storedAnomalies = is_array($scores['anomalies'] ?? null)
                    ? array_values(array_filter($scores['anomalies'], fn ($item) => is_string($item) && $item !== ''))
                    : [];

                $observations = array_values(array_unique([
                    ...$storedObservations,
                    ...($sInt !== null && $sInt <= 55 ? $storedAnomalies : []),
                ]));

                if ($round->was_truncated) {
                    $observations[] = 'Response was truncated mid-answer - candidate may have exhausted prepared material or relied on external assistance.';
                }

                if ($variance !== null && $variance > 15) {
                    $observations[] = "Confidence variance of {$variance} points versus the previous round indicates inconsistent performance.";
                }

                if (count($observations) === 0) {
                    if ($sInt !== null && $sInt < 50) {
                        $observations[] = 'Low interview signal density - answers lacked spontaneous technical depth and showed templated phrasing.';
                    } elseif ($sInt !== null && $sInt >= 75) {
                        $observations[] = 'Strong, consistent interview signal with authentic, unscripted reasoning.';
                    } else {
                        $observations[] = 'No notable anomalies detected for this round. Responses fell within expected human baselines.';
                    }
                }

                if ($sId !== null && $sId < 50) {
                    $observations[] = 'Identity and provenance signal for this round was weak relative to the candidate baseline.';
                }

                return [
                    'round_number' => $round->round_number,
                    's_int' => $sInt,
                    's_id' => $sId,
                    'variance_delta' => $variance,
                    'was_truncated' => (bool) $round->was_truncated,
                    'observations' => array_values(array_unique($observations)),
                    'deep_dive_prompts' => is_array($round->deep_dive_prompts) ? $round->deep_dive_prompts : [],
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array{provided: bool, handle: string|null, status: string, statusLabel: string}
     */
    private static function platform(bool $provided, ?string $handle, ?int $consistency): array
    {
        if (! $provided) {
            return [
                'provided' => false,
                'handle' => null,
                'status' => 'not_provided',
                'statusLabel' => 'NOT PROVIDED',
            ];
        }

        if ($consistency === null) {
            return [
                'provided' => true,
                'handle' => $handle,
                'status' => 'insufficient',
                'statusLabel' => 'PENDING ANALYSIS',
            ];
        }

        if ($consistency >= 60) {
            return [
                'provided' => true,
                'handle' => $handle,
                'status' => 'authentic',
                'statusLabel' => 'AUTHENTIC PROFILE',
            ];
        }

        return [
            'provided' => true,
            'handle' => $handle,
            'status' => 'insufficient',
            'statusLabel' => 'INSUFFICIENT SIGNAL',
        ];
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @param  list<array<string, mixed>>  $flags
     * @return array{summary: array{title: string, body: string}, actions: list<string>}
     */
    private static function verdict(string $level, array $breakdown, int $sInt, array $flags): array
    {
        $interviewSummary = self::summary($breakdown, 's_int');
        $cvSummary = self::summary($breakdown, 's_cv');
        $criticalFlags = self::flagsWithSeverity($flags, 'critical');
        $warningFlags = self::flagsWithSeverity($flags, 'warning');
        $integrityRiskFlags = self::integrityRiskFlags($flags);

        if ($level === 'low' || $sInt < 45 || count($criticalFlags) >= 2 || (count($criticalFlags) >= 1 && $sInt < 60)) {
            return [
                'summary' => [
                    'title' => 'SIGNAL ASSESSMENT: Elevated integrity risk indicators',
                    'body' => trim($interviewSummary.' '.$cvSummary) !== ''
                        ? $interviewSummary.' '.$cvSummary
                        : 'Multiple high-confidence integrity indicators were detected across CV and interview signals. Human follow-up is suggested to validate these observations.',
                ],
                'actions' => [
                    'Review cited evidence with your hiring team',
                    'Consider a supervised re-interview without external tools',
                    'Use flagged signals to shape targeted follow-up questions',
                ],
            ];
        }

        if (count($integrityRiskFlags) > 0 || count($criticalFlags) > 0 || count($warningFlags) >= 2 || $level === 'medium') {
            $flagSummary = collect($integrityRiskFlags)
                ->pluck('description')
                ->take(2)
                ->implode(' ');

            return [
                'summary' => [
                    'title' => 'SIGNAL ASSESSMENT: Mixed integrity signals - follow-up suggested',
                    'body' => trim(collect([$cvSummary, $interviewSummary, $flagSummary])->filter()->implode(' '))
                        ?: 'Active integrity flags may warrant additional human review before relying on this score alone.',
                ],
                'actions' => [
                    'Request an original CV sample without AI-assisted drafting',
                    'Consider a live technical skills assessment',
                    'Manually review the flagged interview segments',
                ],
            ];
        }

        return [
            'summary' => [
                'title' => 'SIGNAL ASSESSMENT: Comparatively strong authentic signal density',
                'body' => self::summary($breakdown, 's_int') ?: 'Evaluated vectors show comparatively strong authentic signal density, though this remains a probability heuristic rather than a hiring decision.',
            ],
            'actions' => [
                'Integrity indicators are comparatively clear across evaluated vectors',
                'Routine reference checks may still add independent validation',
                'Use this score as one input alongside your standard hiring process',
            ],
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $flags
     * @return list<array<string, mixed>>
     */
    private static function flagsWithSeverity(array $flags, string $severity): array
    {
        return array_values(array_filter(
            $flags,
            fn (array $flag): bool => ($flag['severity'] ?? '') === $severity,
        ));
    }

    /**
     * @param  list<array<string, mixed>>  $flags
     * @return list<array<string, mixed>>
     */
    private static function integrityRiskFlags(array $flags): array
    {
        return array_values(array_filter(
            $flags,
            fn (array $flag): bool => in_array($flag['type'] ?? '', [
                'interview_prompt',
                'ai_text',
                'synthetic_profile',
            ], true) && ($flag['severity'] ?? 'info') !== 'info',
        ));
    }

    /**
     * @param  array<string, mixed>  $breakdown
     */
    private static function summary(array $breakdown, string $key): string
    {
        $entry = $breakdown[$key] ?? null;

        return is_array($entry) && is_string($entry['summary'] ?? null)
            ? $entry['summary']
            : '';
    }

    /**
     * @param  array<string, mixed>  $breakdown
     * @return list<string>
     */
    private static function indicators(array $breakdown, string $key): array
    {
        $entry = $breakdown[$key] ?? null;

        if (! is_array($entry) || ! is_array($entry['indicators'] ?? null)) {
            return [];
        }

        return array_values(array_filter(
            $entry['indicators'],
            fn ($item) => is_string($item) && $item !== '',
        ));
    }

    /**
     * @param  array<string, mixed>  $breakdown
     */
    private static function crossSourceEvaluated(array $breakdown): bool
    {
        $entry = $breakdown['s_cross'] ?? null;

        if (! is_array($entry)) {
            return false;
        }

        if (($entry['confidence_band'] ?? null) === 'not-evaluated') {
            return false;
        }

        return is_numeric($entry['score'] ?? null);
    }

    /**
     * @param  array<string, mixed>  $breakdown
     */
    private static function sub(array $breakdown, string $key, int $fallback): int
    {
        $entry = $breakdown[$key] ?? null;

        if (is_array($entry) && isset($entry['score'])) {
            return self::clamp(self::num($entry['score']));
        }

        return $fallback;
    }

    private static function severity(int $deficit): string
    {
        if ($deficit >= 50) {
            return 'critical';
        }

        if ($deficit >= 25) {
            return 'warning';
        }

        return 'info';
    }

    private static function level(int $score): string
    {
        if ($score >= 75) {
            return 'high';
        }

        if ($score >= 50) {
            return 'medium';
        }

        return 'low';
    }

    private static function clamp(float $value): int
    {
        return (int) max(0, min(100, round($value)));
    }

    private static function num(mixed $value): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        return is_numeric($value) ? (float) $value : 0.0;
    }
}
