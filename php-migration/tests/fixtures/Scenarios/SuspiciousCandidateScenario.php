<?php

namespace Tests\Fixtures\Scenarios;

use Tests\Fixtures\Contracts\CandidateScenario;
use Tests\Fixtures\FixtureLoader;

class SuspiciousCandidateScenario implements CandidateScenario
{
    public function slug(): string
    {
        return 'scenario-2-suspicious-marcus-chen';
    }

    public function candidateName(): string
    {
        return 'Marcus Chen';
    }

    public function role(): string
    {
        return 'Senior Backend Engineer';
    }

    public function linkedinUrl(): string
    {
        return 'https://linkedin.com/in/marcus-chen-dev';
    }

    public function githubUsername(): ?string
    {
        return null;
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
                'score' => 58,
                'summary' => 'CV claims five years of Go mastery but uses buzzword-heavy, template-like phrasing with vague outcomes and unverifiable superlatives.',
                'indicators' => [
                    'Phrases such as "synergistic", "best-in-class", and "thought leader" dominate.',
                    'Employer VelocityScale B.V. lacks concrete deliverables.',
                    'Go experience described generically without repositories or metrics.',
                ],
                'confidence_band' => 'low-moderate',
            ],
            's_int' => [
                'score' => 48,
                'summary' => 'Technical interview answers are textbook definitions without spontaneous depth when probed on Go production details.',
                'indicators' => [
                    'Responses lack names, dates, or measurable results.',
                    'Technical follow-ups answered with generic best-practice language.',
                    'Unable to articulate a specific Go version feature or leak debug story.',
                ],
                'confidence_band' => 'low',
            ],
            's_cross' => [
                'score' => 35,
                'summary' => 'LinkedIn shows a .NET-centric career at FinCore Europe with no Go production ownership, conflicting with CV claims and listed employers.',
                'indicators' => [
                    'CV lists five years Go; LinkedIn emphasizes C# / .NET only.',
                    'VelocityScale role on CV absent from LinkedIn history.',
                    'Timeline suggests full-time .NET employment during claimed Go leadership period.',
                ],
                'confidence_band' => 'low',
            ],
            's_id' => [
                'score' => 52,
                'summary' => 'Material inconsistencies between self-reported CV narrative and public professional profile reduce baseline confidence.',
                'indicators' => ['Primary stack mismatch between CV and LinkedIn.'],
                'confidence_band' => 'low-moderate',
            ],
            'follow_up_suggested' => [
                'Ask for a walkthrough of a specific Go service they owned including module layout and deployment.',
                'Request clarification on VelocityScale employment dates versus FinCore LinkedIn tenure.',
                'Live coding or architecture whiteboard on channels, context cancellation, and Postgres indexing.',
            ],
            'anomalies' => [
                'Possible AI-generated CV wording detected.',
                'LinkedIn timeline conflicts with stated five-year Go specialization.',
                'Interview responses show low lexical variance and rehearsed structure.',
                'Technical depth collapses under concrete follow-up questions.',
            ],
        ];
    }

    /**
     * {@inheritdoc}
     */
    public function publicProfilePayload(): array
    {
        return [
            'linkedin_text' => $this->linkedinProfileText(),
            'github_text' => null,
        ];
    }
}
