<?php

namespace App\Services;

/**
 * Detects deterministic live-assistance indicators in interview transcripts
 * before Mistral scoring, so obvious pause/typing patterns still affect s_int.
 */
class TranscriptIntegritySignalDetector
{
    /**
     * @return list<array{type: string, severity: string, description: string, confidence: float}>
     */
    public function detect(string $transcript): array
    {
        $transcript = trim($transcript);

        if ($transcript === '') {
            return [];
        }

        $flags = [];
        $pauseCount = preg_match_all('/\[(?:long |extended )?pause[^\]]*\]/i', $transcript, $pauseMatches);
        $hasKeyboardCue = (bool) preg_match('/\b(?:keyboard|typing|clicking)\b/i', $transcript);
        $hasFormalPivot = (bool) preg_match('/\bcertainly!\b/i', $transcript)
            && (bool) preg_match('/\b(?:number one:|first, one must|to debug this, you can utilize)\b/i', $transcript);

        if ($pauseCount >= 2 || ($pauseCount >= 1 && $hasKeyboardCue)) {
            $flags[] = [
                'type' => 'interview_prompt',
                'severity' => $pauseCount >= 3 || $hasKeyboardCue ? 'critical' : 'warning',
                'description' => 'Transcript documents '.$pauseCount.' latency pause(s)'
                    .($hasKeyboardCue ? ' with audible keyboard activity' : '')
                    .' before structured answers, which may indicate live prompt assistance.',
                'confidence' => $hasKeyboardCue ? 0.94 : 0.88,
            ];
        }

        if ($hasFormalPivot) {
            $flags[] = [
                'type' => 'interview_prompt',
                'severity' => 'warning',
                'description' => 'Candidate shifts from hesitant spontaneous phrasing into formal, textbook-style numbered technical prose after pauses.',
                'confidence' => 0.9,
            ];
        }

        return $this->deduplicateFlags($flags);
    }

    /**
     * @param  list<array{type: string, severity: string, description: string, confidence: float}>  $flags
     * @return list<array{type: string, severity: string, description: string, confidence: float}>
     */
    private function deduplicateFlags(array $flags): array
    {
        $seen = [];
        $unique = [];

        foreach ($flags as $flag) {
            $key = $flag['type'].'|'.$flag['description'];

            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[] = $flag;
        }

        return $unique;
    }
}
