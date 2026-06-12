<?php

namespace App\Services\Mistral;

use App\Contracts\DocumentExtractor;
use App\Services\Storage\SignedStorageUrlService;

class MistralOcrDocumentExtractor implements DocumentExtractor
{
    public function __construct(
        private MistralClient $client,
        private SignedStorageUrlService $storage,
    ) {}

    public function extractText(string $path): string
    {
        if ($path === '') {
            throw new \InvalidArgumentException('A document path is required for OCR extraction.');
        }

        $contents = $this->storage->get($path);

        if ($contents === null) {
            throw new \RuntimeException("Document not found at path: {$path}");
        }

        $response = $this->client->ocr(base64_encode($contents));

        return $this->parseOcrResponse($response);
    }

    /**
     * @param  array<string, mixed>  $response
     */
    private function parseOcrResponse(array $response): string
    {
        $pages = $response['pages'] ?? [];

        if (! is_array($pages) || $pages === []) {
            throw new \RuntimeException('Mistral OCR returned no page content.');
        }

        $markdown = collect($pages)
            ->map(function ($page) {
                if (! is_array($page)) {
                    return '';
                }

                return is_string($page['markdown'] ?? null)
                    ? $page['markdown']
                    : (is_string($page['text'] ?? null) ? $page['text'] : '');
            })
            ->filter()
            ->implode("\n\n");

        if ($markdown === '') {
            throw new \RuntimeException('Mistral OCR returned empty text.');
        }

        return $markdown;
    }
}
