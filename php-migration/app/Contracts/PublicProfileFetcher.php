<?php

namespace App\Contracts;

interface PublicProfileFetcher
{
    /**
     * @return array{linkedin_text: ?string, github_text: ?string}
     */
    public function fetch(?string $linkedinUrl, ?string $githubUsername): array;
}
