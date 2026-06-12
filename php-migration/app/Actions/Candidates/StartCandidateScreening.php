<?php

namespace App\Actions\Candidates;

use App\DataTransferObjects\StartCandidateScreeningData;
use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Enums\TranscriptionStatus;
use App\Jobs\ProcessCandidateScreeningJob;
use App\Jobs\TranscribeAudioJob;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\Team;
use App\Services\PlanFeatures;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\Storage\StoragePathBuilder;
use App\Services\TextContentLimiter;
use App\Services\TokenService;
use App\Services\TranscriptTokenService;
use Illuminate\Support\Facades\DB;

class StartCandidateScreening
{
    public function __construct(
        private TokenService $tokenService,
        private PlanFeatures $planFeatures,
        private StoragePathBuilder $storagePathBuilder,
        private SignedStorageUrlService $storage,
        private TextContentLimiter $textContentLimiter,
        private TranscriptTokenService $transcriptTokenService,
    ) {}

    public function handle(Team $team, StartCandidateScreeningData $data): Candidate
    {
        return DB::transaction(function () use ($team, $data) {
            [$roleId, $roleTitle, $jobDescription] = $this->resolveRoleContext($team, $data);

            $limitedCvText = $data->cvText !== null
                ? $this->textContentLimiter->limitCvText($data->cvText)['text']
                : null;

            $candidate = $team->candidates()->create([
                'name' => $data->name,
                'email' => $data->email,
                'role_id' => $roleId,
                'role' => $roleTitle,
                'job_description' => $jobDescription,
                'cv_path' => null,
                'cv_text' => $limitedCvText,
                'cv_format' => $data->cvFormat?->value,
                'linkedin_url' => $data->linkedinUrl,
                'github_username' => $data->githubUsername,
                'linkedin_text' => $data->linkedinText,
                'github_text' => $data->githubText,
                'status' => $data->requiresAudioTranscription
                    ? CandidateStatus::Processing
                    : CandidateStatus::Pending,
            ]);

            if ($data->cvFile !== null) {
                $extension = $data->cvFile->getClientOriginalExtension();
                $cvPath = $this->storagePathBuilder->cv($candidate->id, $extension);
                $this->storage->put($cvPath, $data->cvFile->get());
                $candidate->update([
                    'cv_path' => $cvPath,
                    'cv_format' => $data->cvFormat?->value ?? $this->resolveFileFormat($extension)->value,
                ]);
            }

            foreach ($data->transcripts as $index => $transcript) {
                $limited = $this->textContentLimiter->limitTranscriptText($transcript);

                $candidate->interviewRounds()->create([
                    'round_number' => $index + 1,
                    'transcript_text' => $limited['text'],
                    'was_truncated' => $limited['was_truncated'],
                    'interviewer_notes' => $data->interviewerNotes[$index] ?? null,
                    'audio_path' => $index === 0 ? $data->transcriptAudioPath : null,
                    'transcription_status' => $index === 0 && $data->requiresAudioTranscription
                        ? TranscriptionStatus::Pending
                        : null,
                ]);
            }

            $this->tokenService->consume($team, $candidate);

            if ($data->requiresAudioTranscription && $data->transcriptAudioPath !== null) {
                $this->transcriptTokenService->consume($team);
                $round = $candidate->interviewRounds()->first();

                TranscribeAudioJob::dispatch(
                    audioPath: $data->transcriptAudioPath,
                    interviewRoundId: $round?->id,
                    candidateId: $candidate->id,
                )->onQueue(config('certalytic.queues.transcriptions'));

                return $candidate;
            }

            $queue = $this->planFeatures->can($team, 'priority_queue')
                ? config('certalytic.queues.priority')
                : config('certalytic.queues.default');

            ProcessCandidateScreeningJob::dispatch($candidate)->onQueue($queue);

            return $candidate;
        });
    }

    /**
     * @return array{0: ?int, 1: ?string, 2: ?string}
     */
    private function resolveRoleContext(Team $team, StartCandidateScreeningData $data): array
    {
        if ($data->roleId !== null) {
            /** @var Role $jobRole */
            $jobRole = $team->roles()->findOrFail($data->roleId);

            return [$jobRole->id, $jobRole->title, $jobRole->description];
        }

        return [null, $data->role, $data->jobDescription];
    }

    private function resolveFileFormat(string $extension): CvFormat
    {
        return match (strtolower($extension)) {
            'pdf' => CvFormat::Pdf,
            'doc', 'docx' => CvFormat::Docx,
            'md', 'markdown' => CvFormat::Markdown,
            default => CvFormat::Markdown,
        };
    }
}
