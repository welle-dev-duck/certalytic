<?php

namespace App\Services;

use App\Services\Storage\SignedStorageUrlService;
use RuntimeException;

class CaptionFileParser
{
    public function __construct(
        private LocalCvReader $localCvReader,
        private SignedStorageUrlService $storage,
    ) {}

    public function parseUploadedPath(string $path, string $extension): string
    {
        $contents = $this->storage->get($path);

        if ($contents === null || trim($contents) === '') {
            throw new RuntimeException('Uploaded transcript file is empty or unreadable.');
        }

        return $this->parseContents($contents, $extension);
    }

    public function parseContents(string $contents, string $extension): string
    {
        return match (strtolower(ltrim($extension, '.'))) {
            'vtt' => $this->parseVtt($contents),
            'doc', 'docx' => $this->localCvReader->readDocxFromContents($contents),
            'txt', 'md', 'markdown' => trim($contents),
            default => throw new RuntimeException('Unsupported transcript file format.'),
        };
    }

    private function parseVtt(string $contents): string
    {
        $lines = preg_split('/\R/', $contents) ?: [];
        $segments = [];

        foreach ($lines as $line) {
            $trimmed = trim($line);

            if ($trimmed === '' || str_starts_with($trimmed, 'WEBVTT') || str_contains($trimmed, '-->')) {
                continue;
            }

            if (preg_match('/^[\d\s:.,-]+$/', $trimmed)) {
                continue;
            }

            $segments[] = $trimmed;
        }

        $text = trim(implode("\n", $segments));

        if ($text === '') {
            throw new RuntimeException('VTT file did not contain readable caption text.');
        }

        return $text;
    }
}
