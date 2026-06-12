<?php

namespace App\Services;

class TranscriptProcessor
{
    /**
     * @return array{text: string, was_truncated: bool, word_count: int}
     */
    public function process(string $transcript): array
    {
        $wordCount = str_word_count($transcript);
        $cap = config('certalytic.transcript.hard_cap_characters');

        if (mb_strlen($transcript) <= $cap) {
            return [
                'text' => $transcript,
                'was_truncated' => false,
                'word_count' => $wordCount,
            ];
        }

        return [
            'text' => $this->smartTruncate($transcript, $cap),
            'was_truncated' => true,
            'word_count' => $wordCount,
        ];
    }

    public function exceedsSoftWarning(string $transcript): bool
    {
        return str_word_count($transcript) > config('certalytic.transcript.soft_warning_words');
    }

    private function smartTruncate(string $transcript, int $cap): string
    {
        $lines = preg_split('/\R/', $transcript) ?: [];
        $segments = [];

        if ($lines !== []) {
            $segments[] = array_shift($lines);
        }

        foreach ($lines as $line) {
            if (preg_match('/^(interviewer|q:|question)/i', trim($line))) {
                $segments[] = $line;
            } elseif (preg_match('/^(candidate|a:|answer)/i', trim($line))) {
                $segments[] = $line;
            }
        }

        if ($lines !== []) {
            $segments[] = end($lines);
        }

        $result = implode("\n", array_filter($segments));

        if (mb_strlen($result) > $cap) {
            $result = mb_substr($result, 0, $cap);
        }

        return $result;
    }
}
