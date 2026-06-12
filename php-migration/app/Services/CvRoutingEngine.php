<?php

namespace App\Services;

use App\Contracts\DocumentExtractor;
use App\Enums\CvFormat;
use App\Services\Storage\SignedStorageUrlService;
use RuntimeException;

class CvRoutingEngine
{
    public function __construct(
        private DocumentExtractor $ocrExtractor,
        private LocalCvReader $localCvReader,
        private SignedStorageUrlService $storage,
    ) {}

    public function extract(string $relativePath, CvFormat $format): string
    {
        return match ($format) {
            CvFormat::Pdf => $this->ocrExtractor->extractText($relativePath),
            CvFormat::Docx => $this->readDocx($relativePath),
            CvFormat::Markdown => $this->readPlainText($relativePath),
            CvFormat::Text => throw new RuntimeException('Text CVs must be stored in cv_text.'),
        };
    }

    private function readDocx(string $relativePath): string
    {
        $contents = $this->storage->get($relativePath);

        if ($contents === null) {
            throw new RuntimeException("CV document not found at path: {$relativePath}");
        }

        return $this->localCvReader->readDocxFromContents($contents);
    }

    private function readPlainText(string $relativePath): string
    {
        $contents = $this->storage->get($relativePath);

        if ($contents === null || trim($contents) === '') {
            throw new RuntimeException("CV document not found or empty at path: {$relativePath}");
        }

        return $contents;
    }
}
