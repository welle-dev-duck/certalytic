<?php

namespace App\Services;

use App\Enums\CvFormat;
use App\Models\Candidate;

class CvContentResolver
{
    public function __construct(
        private CvRoutingEngine $cvRoutingEngine,
        private TextContentLimiter $textContentLimiter,
    ) {}

    public function resolve(Candidate $candidate): string
    {
        if (is_string($candidate->cv_text) && $candidate->cv_text !== '') {
            return $this->textContentLimiter->limitCvText($candidate->cv_text)['text'];
        }

        if ($candidate->cv_path === null) {
            throw new \RuntimeException('Candidate has no CV content to process.');
        }

        $format = $candidate->cv_format ?? CvFormat::Pdf;
        $text = $this->cvRoutingEngine->extract($candidate->cv_path, $format);

        return $this->textContentLimiter->limitCvText($text)['text'];
    }
}
