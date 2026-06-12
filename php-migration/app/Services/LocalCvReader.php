<?php

namespace App\Services;

use RuntimeException;
use ZipArchive;

class LocalCvReader
{
    public function readDocx(string $absolutePath): string
    {
        $contents = file_get_contents($absolutePath);

        if ($contents === false) {
            throw new RuntimeException('Unable to read Word document.');
        }

        return $this->readDocxFromContents($contents);
    }

    public function readDocxFromContents(string $contents): string
    {
        $tempPath = $this->writeTempFile($contents, 'docx');

        try {
            return $this->extractDocxFromPath($tempPath);
        } finally {
            @unlink($tempPath);
        }
    }

    public function readPlainText(string $absolutePath): string
    {
        $contents = file_get_contents($absolutePath);

        if ($contents === false || trim($contents) === '') {
            throw new RuntimeException('Document file is empty or unreadable.');
        }

        return $contents;
    }

    private function extractDocxFromPath(string $absolutePath): string
    {
        $zip = new ZipArchive;

        if ($zip->open($absolutePath) !== true) {
            throw new RuntimeException('Unable to read Word document.');
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($xml === false) {
            throw new RuntimeException('Word document did not contain readable content.');
        }

        $text = strip_tags(str_replace(['</w:p>', '</w:tr>'], ["\n", "\n"], $xml));
        $text = html_entity_decode($text, ENT_QUOTES | ENT_XML1);
        $text = preg_replace("/\n{3,}/", "\n\n", trim($text)) ?? '';

        if ($text === '') {
            throw new RuntimeException('Word document did not contain readable content.');
        }

        return $text;
    }

    private function writeTempFile(string $contents, string $extension): string
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'certalytic-').".{$extension}";

        if (file_put_contents($tempPath, $contents) === false) {
            throw new RuntimeException('Unable to prepare document for local parsing.');
        }

        return $tempPath;
    }
}
