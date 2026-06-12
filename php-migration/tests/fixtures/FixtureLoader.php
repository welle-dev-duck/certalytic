<?php

namespace Tests\Fixtures;

use RuntimeException;

class FixtureLoader
{
    private const BASE_PATH = __DIR__.'/../fixtures';

    public static function jobDescription(): string
    {
        return self::read('job-description.md');
    }

    public static function read(string $relativePath): string
    {
        $path = self::BASE_PATH.'/'.ltrim($relativePath, '/');

        if (! is_file($path)) {
            throw new RuntimeException("Fixture not found: {$relativePath}");
        }

        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Fixture unreadable: {$relativePath}");
        }

        return $contents;
    }
}
