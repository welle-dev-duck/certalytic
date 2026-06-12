<?php

namespace Tests\Fixtures\Contracts;

interface CandidateScenario
{
    public function slug(): string;

    public function candidateName(): string;

    public function role(): string;

    public function linkedinUrl(): string;

    public function githubUsername(): ?string;

    public function cvText(): string;

    public function linkedinProfileText(): string;

    /**
     * @return array<int, string>
     */
    public function transcripts(): array;

    /**
     * @return array<string, mixed>
     */
    public function mistralChatResponse(): array;

    /**
     * @return array{linkedin_text: ?string, github_text: ?string}
     */
    public function publicProfilePayload(): array;
}
