<?php

namespace App\Actions\Candidates;

use App\Enums\CandidateStatus;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Models\Candidate;
use App\Models\Team;
use App\Services\PlanFeatures;
use App\Services\TokenService;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RerunCandidateScreening
{
    public function __construct(
        private TokenService $tokenService,
        private PlanFeatures $planFeatures,
    ) {}

    public function handle(Team $team, Candidate $candidate): Candidate
    {
        if ($candidate->team_id !== $team->id) {
            throw new RuntimeException('Candidate does not belong to this team.');
        }

        if (! $candidate->interviewRounds()->exists()) {
            throw new RuntimeException('Cannot re-run screening without interview transcripts.');
        }

        if (! $this->tokenService->canConsume($team)) {
            throw new RuntimeException('Insufficient tokens. Upgrade your plan or purchase a token pack.');
        }

        return DB::transaction(function () use ($team, $candidate): Candidate {
            $this->tokenService->consume($team, $candidate);

            $candidate->interviewRounds()
                ->where('round_number', '>', 1)
                ->delete();

            $candidate->interviewRounds()->update([
                'was_truncated' => false,
                'round_scores' => null,
                'variance_delta' => null,
                'deep_dive_prompts' => null,
            ]);

            $candidate->update([
                'status' => CandidateStatus::Pending,
                'integrity_score' => null,
                'score_breakdown' => null,
                'follow_up_suggested' => null,
                'high_inconsistency_warning' => false,
                'error_message' => null,
                'processed_at' => null,
                'cv_analysis_results' => null,
            ]);

            $queue = $this->planFeatures->can($team, 'priority_queue')
                ? config('certalytic.queues.priority')
                : config('certalytic.queues.default');

            ProcessCandidateScreeningJob::dispatch($candidate->fresh())->onQueue($queue);

            return $candidate->fresh(['interviewRounds']);
        });
    }
}
