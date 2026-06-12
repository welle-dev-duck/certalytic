<?php

namespace Tests\Fixtures\Mocks;

use App\Contracts\CandidateEvaluator;
use App\DataTransferObjects\RoleContext;
use Tests\Fixtures\Contracts\CandidateScenario;

class ScenarioCandidateEvaluator implements CandidateEvaluator
{
    public function __construct(private CandidateScenario $scenario) {}

    /**
     * {@inheritdoc}
     */
    public function evaluate(
        string $cvText,
        array $rounds,
        array $publicProfiles,
        bool $includeCrossSource,
        ?string $role = null,
        ?string $jobDescription = null,
        ?RoleContext $roleContext = null,
    ): array {
        $evaluation = $this->scenario->mistralChatResponse();

        if (! $includeCrossSource) {
            $evaluation['s_cross'] = [
                'score' => null,
                'summary' => 'No LinkedIn or GitHub profiles were submitted, so platform cross-reference was not performed.',
                'indicators' => ['Platform checks skipped - insufficient external profile data.'],
                'confidence_band' => 'not-evaluated',
            ];
        }

        return $evaluation;
    }
}
