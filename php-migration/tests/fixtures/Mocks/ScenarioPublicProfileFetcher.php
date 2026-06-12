<?php

namespace Tests\Fixtures\Mocks;

use App\Contracts\PublicProfileFetcher;
use Tests\Fixtures\Contracts\CandidateScenario;

class ScenarioPublicProfileFetcher implements PublicProfileFetcher
{
    public function __construct(private CandidateScenario $scenario) {}

    /**
     * {@inheritdoc}
     */
    public function fetch(?string $linkedinUrl, ?string $githubUsername): array
    {
        return $this->scenario->publicProfilePayload();
    }
}
