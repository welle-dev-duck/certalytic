<?php

namespace App\Contracts;

interface DocumentExtractor
{
    /**
     * Extract plain text from a document stored at the given path.
     */
    public function extractText(string $path): string;
}
