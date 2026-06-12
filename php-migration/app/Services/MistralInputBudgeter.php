<?php

namespace App\Services;

class MistralInputBudgeter
{
    public function __construct(private TranscriptProcessor $transcriptProcessor) {}

    /**
     * @return array{cv_text: string, transcript_text: string, cv_truncated: bool, transcript_truncated: bool}
     */
    public function budget(string $cvText, string $transcriptText): array
    {
        $maxTokens = config('certalytic.limits.mistral_max_input_tokens');
        $charsPerToken = config('certalytic.limits.chars_per_token_estimate');
        $maxCharacters = $maxTokens * $charsPerToken;

        $cvLength = mb_strlen($cvText);
        $transcriptLength = mb_strlen($transcriptText);
        $totalLength = $cvLength + $transcriptLength;

        if ($totalLength <= $maxCharacters) {
            return [
                'cv_text' => $cvText,
                'transcript_text' => $transcriptText,
                'cv_truncated' => false,
                'transcript_truncated' => false,
            ];
        }

        $cvShare = $cvLength / max(1, $totalLength);
        $cvBudget = (int) floor($maxCharacters * $cvShare);
        $transcriptBudget = max(1, $maxCharacters - $cvBudget);

        $cvTruncated = $cvLength > $cvBudget;
        $transcriptTruncated = $transcriptLength > $transcriptBudget;

        $budgetedCv = $cvTruncated ? mb_substr($cvText, 0, $cvBudget) : $cvText;

        $processedTranscript = $this->transcriptProcessor->process(
            $transcriptTruncated ? mb_substr($transcriptText, 0, $transcriptBudget) : $transcriptText,
        );

        return [
            'cv_text' => $budgetedCv,
            'transcript_text' => $processedTranscript['text'],
            'cv_truncated' => $cvTruncated,
            'transcript_truncated' => $transcriptTruncated || $processedTranscript['was_truncated'],
        ];
    }
}
