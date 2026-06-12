<?php

namespace App\Services;

class IntegrityScoreCalculator
{
    /**
     * @return array<string, string>
     */
    private function componentWeightKeys(): array
    {
        return [
            's_cv' => 'cv',
            's_int' => 'interview',
            's_cross' => 'cross_source',
            's_id' => 'identity',
        ];
    }

    /**
     * Extract only the four integrity components from a full Mistral evaluation.
     * Supplementary behaviour_analysis and personality_analysis sections are excluded.
     *
     * @param  array<string, mixed>  $evaluation
     * @return array<string, array<string, mixed>>
     */
    public function scoreComponentsFromEvaluation(array $evaluation): array
    {
        $components = [];

        foreach (array_keys($this->componentWeightKeys()) as $key) {
            $component = $evaluation[$key] ?? null;
            $components[$key] = is_array($component) ? $component : ['score' => 0];
        }

        return $components;
    }

    /**
     * @param  array<string, array<string, mixed>>  $components
     */
    public function calculate(array $components): float
    {
        $weights = config('certalytic.score_weights');
        $weightedSum = 0.0;
        $totalWeight = 0.0;

        foreach ($this->componentWeightKeys() as $componentKey => $weightKey) {
            $component = $components[$componentKey] ?? null;

            if (! $this->componentIncludedInScore($component)) {
                continue;
            }

            $weightedSum += $this->componentScore($component) * $weights[$weightKey];
            $totalWeight += $weights[$weightKey];
        }

        if ($totalWeight <= 0.0) {
            return 0.0;
        }

        return round($weightedSum / $totalWeight, 2);
    }

    public function componentIncludedInScore(mixed $component): bool
    {
        if (! is_array($component)) {
            return false;
        }

        if (($component['confidence_band'] ?? null) === 'not-evaluated') {
            return false;
        }

        if (array_key_exists('score', $component) && $component['score'] === null) {
            return false;
        }

        return isset($component['score']) && is_numeric($component['score']);
    }

    /**
     * @param  array<string, mixed>  $component
     */
    private function componentScore(array $component): float
    {
        if (! isset($component['score']) || ! is_numeric($component['score'])) {
            return 0.0;
        }

        return (float) $component['score'];
    }

    /**
     * @param  array<int, float>  $roundScores  keyed by round number
     */
    public function rollingInterviewScore(array $roundScores): float
    {
        if ($roundScores === []) {
            return 0.0;
        }

        if (count($roundScores) === 1) {
            return round((float) reset($roundScores), 2);
        }

        $weights = config('certalytic.round_weights');
        $totalWeight = 0.0;
        $weightedSum = 0.0;

        foreach ($roundScores as $roundNumber => $score) {
            $weight = $weights[$roundNumber] ?? 0.0;
            $weightedSum += $score * $weight;
            $totalWeight += $weight;
        }

        return $totalWeight > 0 ? round($weightedSum / $totalWeight, 2) : round((float) reset($roundScores), 2);
    }

    public function varianceDelta(float $previousScore, float $currentScore): float
    {
        return round(abs($previousScore - $currentScore), 2);
    }

    public function hasHighInconsistency(float $varianceDelta): bool
    {
        return $varianceDelta > config('certalytic.variance_threshold');
    }
}
