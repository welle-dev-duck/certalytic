<?php

namespace App\Services;

/**
 * Aligns Mistral component scores, round analyses, and flags when the model
 * returns contradictory signals (e.g. critical interview flags with s_int 85).
 */
class IntegrityEvaluationReconciler
{
    /**
     * @param  array<string, mixed>  $evaluation
     * @return array<string, mixed>
     */
    public function reconcile(array $evaluation, bool $hasExternalProfiles): array
    {
        $evaluation['flags'] = $this->normalizeFlags(
            is_array($evaluation['flags'] ?? null) ? $evaluation['flags'] : [],
            $hasExternalProfiles,
        );

        [$sIntCap, $sCvCap] = $this->scoreCapsFromFlags($evaluation['flags']);

        $evaluation['s_int'] = $this->capComponent(
            is_array($evaluation['s_int'] ?? null) ? $evaluation['s_int'] : [],
            $sIntCap,
            'Interview authenticity signals were adjusted to align with raised integrity flags.',
        );

        $evaluation['s_cv'] = $this->capComponent(
            is_array($evaluation['s_cv'] ?? null) ? $evaluation['s_cv'] : [],
            $sCvCap,
            'CV authenticity signals were adjusted to align with raised integrity flags.',
        );

        $evaluation['round_analyses'] = $this->reconcileRoundAnalyses(
            is_array($evaluation['round_analyses'] ?? null) ? $evaluation['round_analyses'] : [],
            $evaluation['flags'],
            $sIntCap,
        );

        return $evaluation;
    }

    /**
     * @param  list<array<string, mixed>>  $flags
     * @return list<array<string, mixed>>
     */
    private function normalizeFlags(array $flags, bool $hasExternalProfiles): array
    {
        $normalized = [];

        foreach ($flags as $flag) {
            if (! is_array($flag) || ! is_string($flag['description'] ?? null)) {
                continue;
            }

            $type = is_string($flag['type'] ?? null) ? $flag['type'] : 'interview_prompt';
            $description = $flag['description'];
            $severity = is_string($flag['severity'] ?? null) ? $flag['severity'] : 'warning';

            if ($type === 'platform_mismatch' && ! $hasExternalProfiles) {
                $type = 'insufficient_signal';
                $severity = 'info';
            }

            if ($type === 'ai_text' && $this->flagTargetsInterview($description)) {
                $type = 'interview_prompt';
            }

            $normalized[] = [
                'type' => $type,
                'severity' => $severity,
                'description' => $description,
                'confidence' => is_numeric($flag['confidence'] ?? null)
                    ? max(0, min(1, (float) $flag['confidence']))
                    : 0.75,
            ];
        }

        return $normalized;
    }

    /**
     * @param  list<array<string, mixed>>  $flags
     * @return array{0: float, 1: float}
     */
    private function scoreCapsFromFlags(array $flags): array
    {
        $sIntCap = 100.0;
        $sCvCap = 100.0;

        foreach ($flags as $flag) {
            $type = $flag['type'] ?? '';
            $severity = $flag['severity'] ?? 'warning';
            $description = is_string($flag['description'] ?? null) ? $flag['description'] : '';

            if ($type === 'interview_prompt') {
                $sIntCap = min($sIntCap, $severity === 'critical' ? 40.0 : 55.0);
            }

            if ($type === 'ai_text' && ! $this->flagTargetsInterview($description)) {
                $sCvCap = min($sCvCap, $severity === 'critical' ? 50.0 : 65.0);
            }

            if ($type === 'synthetic_profile' && $severity !== 'info') {
                $sIntCap = min($sIntCap, 60.0);
            }
        }

        return [$sIntCap, $sCvCap];
    }

    /**
     * @param  array<string, mixed>  $component
     * @return array<string, mixed>
     */
    private function capComponent(array $component, float $cap, string $adjustmentSummary): array
    {
        $score = (float) ($component['score'] ?? 50.0);

        if ($score <= $cap) {
            return $component;
        }

        $component['score'] = round($cap, 2);

        if (is_string($component['summary'] ?? null) && $component['summary'] !== '') {
            $component['summary'] = $adjustmentSummary.' '.$component['summary'];
        } else {
            $component['summary'] = $adjustmentSummary;
        }

        return $component;
    }

    /**
     * @param  list<array<string, mixed>>  $roundAnalyses
     * @param  list<array<string, mixed>>  $flags
     * @return list<array<string, mixed>>
     */
    private function reconcileRoundAnalyses(array $roundAnalyses, array $flags, float $sIntCap): array
    {
        $interviewFlagDescriptions = collect($flags)
            ->filter(fn (array $flag): bool => in_array($flag['type'] ?? '', ['interview_prompt', 'ai_text'], true)
                && ($flag['severity'] ?? 'info') !== 'info')
            ->pluck('description')
            ->filter(fn ($description): bool => is_string($description) && $description !== '')
            ->values()
            ->all();

        $reconciled = [];

        foreach ($roundAnalyses as $round) {
            if (! is_array($round)) {
                continue;
            }

            $sInt = (float) ($round['s_int'] ?? 50.0);

            if ($sInt > $sIntCap) {
                $round['s_int'] = round($sIntCap, 2);
            }

            $observations = is_array($round['observations'] ?? null) ? $round['observations'] : [];
            $anomalies = is_array($round['anomalies'] ?? null) ? $round['anomalies'] : [];

            foreach ($interviewFlagDescriptions as $description) {
                if (! in_array($description, $anomalies, true)) {
                    $anomalies[] = $description;
                }
            }

            if ($round['s_int'] <= 55 && count($interviewFlagDescriptions) > 0) {
                foreach ($interviewFlagDescriptions as $description) {
                    if (! in_array($description, $observations, true)) {
                        $observations[] = $description;
                    }
                }
            }

            $round['observations'] = array_values(array_filter(
                $observations,
                fn ($item) => is_string($item) && $item !== '',
            ));
            $round['anomalies'] = array_values(array_filter(
                $anomalies,
                fn ($item) => is_string($item) && $item !== '',
            ));

            $reconciled[] = $round;
        }

        return $reconciled;
    }

    private function flagTargetsInterview(string $description): bool
    {
        $haystack = strtolower($description);

        foreach ([
            'interview',
            'linguistic',
            'conversational',
            'latency',
            'rehears',
            'synthetic response',
            'live prompt',
            'monologue',
        ] as $needle) {
            if (str_contains($haystack, $needle)) {
                return true;
            }
        }

        return false;
    }
}
