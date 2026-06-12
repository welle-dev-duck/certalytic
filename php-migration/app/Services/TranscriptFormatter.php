<?php

namespace App\Services;

class TranscriptFormatter
{
    /**
     * @param  list<array{speaker_id: string, text: string, start: ?float, end: ?float}>  $segments
     * @return array<string, string>
     */
    public function buildDefaultSpeakerLabels(array $segments): array
    {
        $labels = [];

        foreach ($segments as $segment) {
            $speakerId = $segment['speaker_id'] ?? 'speaker_0';

            if (! isset($labels[$speakerId])) {
                $labels[$speakerId] = $this->defaultLabelForSpeaker($speakerId, count($labels));
            }
        }

        return $labels;
    }

    /**
     * @param  list<array{speaker_id: string, text: string, start: ?float, end: ?float}>  $segments
     * @param  array<string, string>  $speakerLabels
     */
    public function formatSegments(array $segments, array $speakerLabels, bool $includeTimestamps = false): string
    {
        $lines = [];

        foreach ($segments as $segment) {
            $text = trim($segment['text'] ?? '');

            if ($text === '') {
                continue;
            }

            $speakerId = $segment['speaker_id'] ?? 'speaker_0';
            $label = $speakerLabels[$speakerId] ?? $this->defaultLabelForSpeaker($speakerId, 0);
            $start = $segment['start'] ?? null;
            $end = $segment['end'] ?? null;

            if ($includeTimestamps && $start !== null && $end !== null) {
                $lines[] = '['.round($start, 1).'s–'.round($end, 1)."s] {$label}: {$text}";
            } else {
                $lines[] = "{$label}: {$text}";
            }
        }

        $formatted = trim(implode("\n", $lines));

        if ($formatted === '') {
            throw new \RuntimeException('Transcript segments contained no speakable text.');
        }

        return $formatted;
    }

    /**
     * @param  list<mixed>  $rawSegments
     * @return list<array{speaker_id: string, text: string, start: ?float, end: ?float}>
     */
    public function normalizeSegments(array $rawSegments): array
    {
        $normalized = [];

        foreach ($rawSegments as $segment) {
            if (! is_array($segment)) {
                continue;
            }

            $text = is_string($segment['text'] ?? null) ? trim($segment['text']) : '';

            if ($text === '') {
                continue;
            }

            $speakerId = is_string($segment['speaker_id'] ?? null) && $segment['speaker_id'] !== ''
                ? $segment['speaker_id']
                : 'speaker_0';

            $normalized[] = [
                'speaker_id' => $speakerId,
                'text' => $text,
                'start' => is_numeric($segment['start'] ?? null) ? (float) $segment['start'] : null,
                'end' => is_numeric($segment['end'] ?? null) ? (float) $segment['end'] : null,
            ];
        }

        return $normalized;
    }

    private function defaultLabelForSpeaker(string $speakerId, int $fallbackIndex): string
    {
        if (preg_match('/speaker_(\d+)/i', $speakerId, $matches)) {
            return 'Speaker '.((int) $matches[1] + 1);
        }

        if (preg_match('/^(\d+)$/', $speakerId, $matches)) {
            return 'Speaker '.((int) $matches[1] + 1);
        }

        $humanized = trim(str_replace('_', ' ', $speakerId));

        if ($humanized !== '' && ! str_starts_with(strtolower($humanized), 'speaker')) {
            return ucwords($humanized);
        }

        return 'Speaker '.($fallbackIndex + 1);
    }
}
