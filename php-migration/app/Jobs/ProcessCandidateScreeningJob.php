<?php

namespace App\Jobs;

use App\Contracts\CandidateEvaluator;
use App\Contracts\PublicProfileFetcher;
use App\Enums\CandidateStatus;
use App\Models\Candidate;
use App\Models\Team;
use App\Services\CvContentResolver;
use App\Services\IntegrityEvaluationReconciler;
use App\Services\IntegrityScoreCalculator;
use App\Services\MistralInputBudgeter;
use App\Services\PlanFeatures;
use App\Services\RoleContextResolver;
use App\Services\TranscriptIntegritySignalDetector;
use App\Services\TranscriptProcessor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProcessCandidateScreeningJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /**
     * @var array<int, int>
     */
    public array $backoff = [10, 30, 60];

    public function __construct(public Candidate $candidate) {}

    public function handle(
        CvContentResolver $cvContentResolver,
        CandidateEvaluator $evaluator,
        PublicProfileFetcher $profileFetcher,
        TranscriptProcessor $transcriptProcessor,
        IntegrityScoreCalculator $scoreCalculator,
        IntegrityEvaluationReconciler $evaluationReconciler,
        TranscriptIntegritySignalDetector $transcriptSignalDetector,
        PlanFeatures $planFeatures,
        RoleContextResolver $roleContextResolver,
        MistralInputBudgeter $inputBudgeter,
    ): void {
        $candidate = $this->candidate->fresh(['interviewRounds', 'team']);

        if ($candidate === null) {
            return;
        }

        $candidate->update([
            'status' => CandidateStatus::Processing,
            'error_message' => null,
        ]);

        try {
            $team = $candidate->team;
            $includeCrossSource = $this->shouldIncludeCrossSource($candidate, $team, $planFeatures);
            $publicProfiles = $this->resolvePublicProfiles($candidate, $profileFetcher);

            $cvText = $cvContentResolver->resolve($candidate);
            $primaryRound = $candidate->interviewRounds->sortBy('round_number')->first();
            $mergedTranscript = $primaryRound?->transcript_text ?? '';

            $budgeted = $inputBudgeter->budget($cvText, $mergedTranscript);
            $cvText = $budgeted['cv_text'];
            $mergedTranscript = $budgeted['transcript_text'];

            $roundPayloads = [];
            $roundInterviewScores = [];

            foreach ($candidate->interviewRounds as $round) {
                $sourceText = $round->round_number === 1 ? $mergedTranscript : $round->transcript_text;
                $processed = $transcriptProcessor->process($sourceText);

                if ($processed['was_truncated']) {
                    $round->update(['was_truncated' => true, 'transcript_text' => $processed['text']]);
                }

                $roundPayloads[] = [
                    'round_number' => $round->round_number,
                    'transcript' => $processed['text'],
                    'interviewer_notes' => $round->interviewer_notes,
                    'was_truncated' => $processed['was_truncated'],
                ];
            }

            $roleContext = $roleContextResolver->resolve($candidate);

            $evaluation = $evaluator->evaluate(
                $cvText,
                $roundPayloads,
                $publicProfiles,
                $includeCrossSource,
                $roleContext->title,
                $roleContext->description,
                $roleContext,
            );

            $hasExternalProfiles = filled($publicProfiles['linkedin_url'] ?? null)
                || filled($publicProfiles['linkedin_text'] ?? null)
                || filled($publicProfiles['github_username'] ?? null)
                || filled($publicProfiles['github_text'] ?? null);

            $transcriptFlags = $transcriptSignalDetector->detect($mergedTranscript);

            if ($transcriptFlags !== []) {
                $existingFlags = is_array($evaluation['flags'] ?? null) ? $evaluation['flags'] : [];
                $evaluation['flags'] = array_merge($existingFlags, $transcriptFlags);
            }

            $evaluation = $evaluationReconciler->reconcile($evaluation, $hasExternalProfiles);

            [$roundInterviewScores, $highInconsistency] = $this->syncVirtualInterviewRounds(
                $candidate,
                $evaluation,
                $scoreCalculator,
            );

            if (count($roundInterviewScores) > 1) {
                $evaluation['s_int']['score'] = $scoreCalculator->rollingInterviewScore($roundInterviewScores);
            }

            $integrityScore = $scoreCalculator->calculate(
                $scoreCalculator->scoreComponentsFromEvaluation($evaluation),
            );

            $candidate->update([
                'status' => CandidateStatus::Complete,
                'cv_analysis_results' => [
                    'extracted_text_preview' => mb_substr($cvText, 0, 500),
                    'public_profiles' => $publicProfiles,
                ],
                'integrity_score' => $integrityScore,
                'score_breakdown' => $evaluation,
                'follow_up_suggested' => $evaluation['follow_up_suggested'],
                'high_inconsistency_warning' => $highInconsistency,
                'processed_at' => now(),
            ]);
        } catch (Throwable $exception) {
            Log::error('Candidate screening failed', [
                'candidate_id' => $candidate->id,
                'message' => $exception->getMessage(),
            ]);

            $candidate->update([
                'status' => CandidateStatus::Failed,
                'error_message' => 'Screening could not be completed. Please try again.',
            ]);

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $evaluation
     * @return array{0: array<int, float>, 1: bool}
     */
    private function syncVirtualInterviewRounds(
        Candidate $candidate,
        array $evaluation,
        IntegrityScoreCalculator $scoreCalculator,
    ): array {
        $roundAnalyses = collect($evaluation['round_analyses'] ?? [])
            ->sortBy(fn (array $analysis): int => (int) ($analysis['round_number'] ?? 0))
            ->values();

        if ($roundAnalyses->isEmpty()) {
            return $this->syncSingleInterviewRound($candidate, $evaluation, $scoreCalculator);
        }

        $mergedRound = $candidate->interviewRounds()->orderBy('round_number')->first();
        $previousRoundScore = null;
        $highInconsistency = false;
        $roundInterviewScores = [];
        $activeRoundNumbers = [];

        foreach ($roundAnalyses as $index => $roundAnalysis) {
            $roundNumber = (int) ($roundAnalysis['round_number'] ?? ($index + 1));
            $activeRoundNumbers[] = $roundNumber;

            $roundIntScore = (float) ($roundAnalysis['s_int'] ?? $evaluation['s_int']['score']);
            $roundIdScore = (float) ($roundAnalysis['s_id'] ?? $evaluation['s_id']['score']);

            $varianceDelta = null;

            if ($previousRoundScore !== null) {
                $varianceDelta = $scoreCalculator->varianceDelta($previousRoundScore, $roundIntScore);

                if ($scoreCalculator->hasHighInconsistency($varianceDelta)) {
                    $highInconsistency = true;
                }
            }

            if ($roundIntScore < 55) {
                $highInconsistency = true;
            }

            $roundObservations = is_array($roundAnalysis['observations'] ?? null)
                ? $roundAnalysis['observations']
                : [];
            $roundAnomalies = is_array($roundAnalysis['anomalies'] ?? null)
                ? $roundAnalysis['anomalies']
                : $evaluation['anomalies'];
            $roundPrompts = is_array($roundAnalysis['deep_dive_prompts'] ?? null) && $roundAnalysis['deep_dive_prompts'] !== []
                ? $roundAnalysis['deep_dive_prompts']
                : ($roundNumber === 1 ? $evaluation['follow_up_suggested'] : null);

            $roundPayload = [
                'round_scores' => [
                    's_int' => $roundIntScore,
                    's_id' => $roundIdScore,
                    'observations' => $roundObservations,
                    'anomalies' => $roundAnomalies,
                ],
                'variance_delta' => $varianceDelta,
                'deep_dive_prompts' => $roundPrompts,
            ];

            if ($roundNumber === 1 && $mergedRound !== null) {
                $mergedRound->update($roundPayload);
            } else {
                $candidate->interviewRounds()->updateOrCreate(
                    ['round_number' => $roundNumber],
                    [
                        'transcript_text' => '[Segment identified in merged transcript]',
                        'was_truncated' => (bool) ($mergedRound?->was_truncated ?? false),
                        'interviewer_notes' => null,
                        ...$roundPayload,
                    ],
                );
            }

            $roundInterviewScores[$roundNumber] = $roundIntScore;
            $previousRoundScore = $roundIntScore;
        }

        $candidate->interviewRounds()
            ->where('round_number', '>', 1)
            ->whereNotIn('round_number', $activeRoundNumbers)
            ->delete();

        return [$roundInterviewScores, $highInconsistency];
    }

    /**
     * @param  array<string, mixed>  $evaluation
     * @return array{0: array<int, float>, 1: bool}
     */
    private function syncSingleInterviewRound(
        Candidate $candidate,
        array $evaluation,
        IntegrityScoreCalculator $scoreCalculator,
    ): array {
        $round = $candidate->interviewRounds()->orderBy('round_number')->first();

        if ($round === null) {
            return [[], false];
        }

        $roundIntScore = (float) $evaluation['s_int']['score'];
        $roundIdScore = (float) $evaluation['s_id']['score'];
        $highInconsistency = $roundIntScore < 55;

        $round->update([
            'round_scores' => [
                's_int' => $roundIntScore,
                's_id' => $roundIdScore,
                'observations' => [],
                'anomalies' => $evaluation['anomalies'],
            ],
            'variance_delta' => null,
            'deep_dive_prompts' => $evaluation['follow_up_suggested'],
        ]);

        return [[$round->round_number => $roundIntScore], $highInconsistency];
    }

    private function shouldIncludeCrossSource(Candidate $candidate, Team $team, PlanFeatures $planFeatures): bool
    {
        return ($planFeatures->can($team, 'cross_source_manual')
                || $planFeatures->can($team, 'cross_source'))
            && (filled($candidate->linkedin_text)
                || filled($candidate->linkedin_url)
                || filled($candidate->github_username));
    }

    /**
     * @return array{linkedin_url: ?string, github_username: ?string, linkedin_text: ?string, github_text: ?string}
     */
    private function resolvePublicProfiles(Candidate $candidate, PublicProfileFetcher $profileFetcher): array
    {
        $linkedinText = $candidate->linkedin_text;
        $githubText = $candidate->github_text;

        $needsLinkedInFetch = filled($candidate->linkedin_url) && blank($linkedinText);
        $needsGitHubFetch = filled($candidate->github_username) && blank($githubText);

        if ($needsLinkedInFetch || $needsGitHubFetch) {
            $fetched = $profileFetcher->fetch(
                $needsLinkedInFetch ? $candidate->linkedin_url : null,
                $needsGitHubFetch ? $candidate->github_username : null,
            );

            if ($needsLinkedInFetch) {
                $linkedinText = $fetched['linkedin_text'];
            }

            if ($needsGitHubFetch) {
                $githubText = $fetched['github_text'];
            }

            $candidate->update([
                'linkedin_text' => $linkedinText,
                'github_text' => $githubText,
            ]);
        }

        return [
            'linkedin_url' => $candidate->linkedin_url,
            'github_username' => $candidate->github_username,
            'linkedin_text' => $linkedinText,
            'github_text' => $githubText,
        ];
    }
}
