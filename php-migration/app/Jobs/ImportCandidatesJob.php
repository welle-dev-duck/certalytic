<?php

namespace App\Jobs;

use App\Enums\CandidateStatus;
use App\Enums\CvFormat;
use App\Models\Team;
use App\Services\PlanFeatures;
use App\Services\TokenService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;

class ImportCandidatesJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<int, array{name: string, email: ?string, transcript: string, cv_path: ?string}>  $rows
     */
    public function __construct(
        public Team $team,
        public array $rows,
    ) {}

    public function handle(TokenService $tokenService, PlanFeatures $planFeatures): void
    {
        foreach ($this->rows as $row) {
            if (! $tokenService->canConsume($this->team)) {
                break;
            }

            $cvPath = $row['cv_path'] ?? null;
            $cvText = null;
            $cvFormat = null;

            if ($cvPath === null) {
                $cvText = 'No CV was provided during bulk import. Base CV authenticity scoring on interview transcript signals and any supplied metadata only.';
                $cvFormat = CvFormat::Text;
            } else {
                $cvFormat = $this->resolveFormat($cvPath);
            }

            $candidate = $this->team->candidates()->create([
                'name' => $row['name'],
                'email' => $row['email'] ?? null,
                'cv_path' => $cvPath,
                'cv_text' => $cvText,
                'cv_format' => $cvFormat,
                'status' => CandidateStatus::Pending,
            ]);

            $candidate->interviewRounds()->create([
                'round_number' => 1,
                'transcript_text' => $row['transcript'],
            ]);

            $tokenService->consume($this->team, $candidate);

            $queue = $planFeatures->can($this->team, 'priority_queue')
                ? config('certalytic.queues.priority')
                : config('certalytic.queues.default');

            ProcessCandidateScreeningJob::dispatch($candidate)->onQueue($queue);
        }
    }

    private function resolveFormat(string $path): CvFormat
    {
        return match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'pdf' => CvFormat::Pdf,
            'doc', 'docx' => CvFormat::Docx,
            'md', 'markdown', 'txt' => CvFormat::Markdown,
            default => CvFormat::Pdf,
        };
    }
}
