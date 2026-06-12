<?php

namespace App\Services;

class TranscriptMerger
{
    /**
     * @param  list<string>  $segments
     */
    public function merge(array $segments): string
    {
        $parts = array_values(array_filter(
            array_map(fn (string $segment): string => trim($segment), $segments),
            fn (string $segment): bool => $segment !== '',
        ));

        if ($parts === []) {
            return '';
        }

        if (count($parts) === 1) {
            return $parts[0];
        }

        $merged = [];

        foreach ($parts as $index => $part) {
            $merged[] = '--- Interview transcript '.($index + 1)." ---\n\n".$part;
        }

        return implode("\n\n", $merged);
    }
}
