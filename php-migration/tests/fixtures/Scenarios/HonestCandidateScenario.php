<?php

namespace Tests\Fixtures\Scenarios;

use Tests\Fixtures\Contracts\CandidateScenario;
use Tests\Fixtures\FixtureLoader;

class HonestCandidateScenario implements CandidateScenario
{
    public function slug(): string
    {
        return 'scenario-1-honest-elena-vasquez';
    }

    public function candidateName(): string
    {
        return 'Elena Vasquez';
    }

    public function role(): string
    {
        return 'Senior Backend Engineer';
    }

    public function linkedinUrl(): string
    {
        return 'https://linkedin.com/in/elena-vasquez-go';
    }

    public function githubUsername(): ?string
    {
        return 'elena-vasquez';
    }

    public function cvText(): string
    {
        return FixtureLoader::read("{$this->slug()}/cv.md");
    }

    public function linkedinProfileText(): string
    {
        return FixtureLoader::read("{$this->slug()}/linkedin-profile.md");
    }

    /**
     * @return array<int, string>
     */
    public function transcripts(): array
    {
        return [
            FixtureLoader::read("{$this->slug()}/round-2-technical.md"),
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function mistralChatResponse(): array
    {
        return [
            's_cv' => [
                'score' => 89,
                'summary' => 'CV timeline, skills, and role fit align strongly with the Go platform job description. Language is specific and verifiable.',
                'indicators' => [
                    'Six years Go experience corroborated by concrete fintech projects.',
                    'PostgreSQL and queue-worker ownership matches required stack.',
                    'No generic AI-padding phrases detected.',
                ],
                'confidence_band' => 'high',
            ],
            's_int' => [
                'score' => 87,
                'summary' => 'Technical interview responses are specific, include metrics and trade-offs, and deepen under follow-up questions.',
                'indicators' => [
                    'Incident story includes idempotency, backoff, and communication cadence.',
                    'Technical round demonstrates production Go and Postgres judgment.',
                    'Spontaneous depth under concrete follow-up questions.',
                ],
                'confidence_band' => 'high',
            ],
            's_cross' => [
                'score' => 92,
                'summary' => 'LinkedIn profile matches CV employers, dates, and Go-focused skill set without material contradictions.',
                'indicators' => [
                    'NordLedger and PayStream roles appear on both CV and LinkedIn.',
                    'Go, PostgreSQL, and Redis consistent across sources.',
                    'No conflicting primary language claim.',
                ],
                'confidence_band' => 'high',
            ],
            's_id' => [
                'score' => 88,
                'summary' => 'Identity and career narrative remain coherent across CV, public profile, and the technical interview.',
                'indicators' => ['Employer names and technology stack align end-to-end.'],
                'confidence_band' => 'high',
            ],
            'follow_up_suggested' => [
                'Optional: confirm on-call rotation expectations and team size.',
            ],
            'anomalies' => [],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function publicProfilePayload(): array
    {
        return [
            'linkedin_text' => $this->linkedinProfileText(),
            'github_text' => 'elena-vasquez - Go backend projects, PostgreSQL migrations, queue worker examples. Active in fintech OSS discussions.',
        ];
    }
}
