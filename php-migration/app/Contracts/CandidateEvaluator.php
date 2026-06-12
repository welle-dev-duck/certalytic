<?php

namespace App\Contracts;

use App\DataTransferObjects\RoleContext;

/**
 * @phpstan-type EvaluationComponent array{
 *     score: float,
 *     summary: string,
 *     indicators: array<int, string>,
 *     confidence_band: string
 * }
 * @phpstan-type EvaluationResult array{
 *     s_cv: EvaluationComponent,
 *     s_int: EvaluationComponent,
 *     s_cross: EvaluationComponent,
 *     s_id: EvaluationComponent,
 *     follow_up_suggested: array<int, string>,
 *     anomalies: array<int, string>
 * }
 */
interface CandidateEvaluator
{
    /**
     * @param  array<int, array{round_number: int, transcript: string, was_truncated: bool, interviewer_notes: ?string}>  $rounds
     * @param  array{linkedin_url: ?string, github_username: ?string, linkedin_text: ?string, github_text: ?string}  $publicProfiles
     * @return EvaluationResult
     */
    public function evaluate(
        string $cvText,
        array $rounds,
        array $publicProfiles,
        bool $includeCrossSource,
        ?string $role = null,
        ?string $jobDescription = null,
        ?RoleContext $roleContext = null,
    ): array;
}
