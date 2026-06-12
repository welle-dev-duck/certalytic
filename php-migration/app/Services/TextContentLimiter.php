<?php

namespace App\Services;

class TextContentLimiter
{
    /**
     * @return array{text: string, was_truncated: bool, word_count: int}
     */
    public function limitCvText(string $text): array
    {
        return $this->limit(
            $text,
            config('certalytic.limits.cv_text_max_words'),
            config('certalytic.limits.cv_text_max_characters'),
        );
    }

    /**
     * @return array{text: string, was_truncated: bool, word_count: int}
     */
    public function limitTranscriptText(string $text): array
    {
        return $this->limit(
            $text,
            config('certalytic.limits.transcript_text_max_words'),
            config('certalytic.limits.transcript_text_max_characters'),
        );
    }

    /**
     * @return array{text: string, was_truncated: bool, word_count: int}
     */
    private function limit(string $text, int $maxWords, int $maxCharacters): array
    {
        $wordCount = str_word_count($text);
        $wasTruncated = false;
        $result = $text;

        if ($wordCount > $maxWords) {
            $result = $this->truncateToWordCount($result, $maxWords);
            $wasTruncated = true;
        }

        if (mb_strlen($result) > $maxCharacters) {
            $result = mb_substr($result, 0, $maxCharacters);
            $wasTruncated = true;
        }

        return [
            'text' => $result,
            'was_truncated' => $wasTruncated,
            'word_count' => str_word_count($result),
        ];
    }

    private function truncateToWordCount(string $text, int $maxWords): string
    {
        $words = preg_split('/\s+/u', trim($text), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if (count($words) <= $maxWords) {
            return $text;
        }

        return implode(' ', array_slice($words, 0, $maxWords));
    }
}
