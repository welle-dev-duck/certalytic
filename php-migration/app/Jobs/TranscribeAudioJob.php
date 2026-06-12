<?php

namespace App\Jobs;

use App\Enums\CandidateStatus;
use App\Enums\TranscriptionStatus;
use App\Models\AudioTranscription;
use App\Models\Candidate;
use App\Models\InterviewRound;
use App\Services\Mistral\MistralTranscriptionClient;
use App\Services\PlanFeatures;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\TextContentLimiter;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class TranscribeAudioJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 2;

    public int $timeout = 900;

    public function __construct(
        public string $audioPath,
        public ?int $audioTranscriptionId = null,
        public ?int $interviewRoundId = null,
        public ?int $candidateId = null,
    ) {}

    public function handle(
        MistralTranscriptionClient $transcriptionClient,
        SignedStorageUrlService $storage,
        TextContentLimiter $textContentLimiter,
        PlanFeatures $planFeatures,
    ): void {
        if ($this->audioTranscriptionId !== null) {
            $this->transcribeStandalone($transcriptionClient, $storage, $textContentLimiter);

            return;
        }

        if ($this->interviewRoundId !== null && $this->candidateId !== null) {
            $this->transcribeForScreening($transcriptionClient, $storage, $textContentLimiter, $planFeatures);
        }
    }

    private function transcribeStandalone(
        MistralTranscriptionClient $transcriptionClient,
        SignedStorageUrlService $storage,
        TextContentLimiter $textContentLimiter,
    ): void {
        $record = AudioTranscription::query()->find($this->audioTranscriptionId);

        if ($record === null) {
            return;
        }

        $record->update(['status' => TranscriptionStatus::Processing->value]);

        try {
            $result = $this->runTranscription($transcriptionClient, $storage);
            $limited = $textContentLimiter->limitTranscriptText($result['text']);

            $record->update([
                'status' => TranscriptionStatus::Complete->value,
                'transcript_text' => $limited['text'],
                'segments' => $result['segments'],
                'speaker_labels' => $result['speaker_labels'],
                'duration_seconds' => $result['duration_seconds'],
                'audio_path' => null,
                'error_message' => null,
            ]);
        } catch (Throwable $exception) {
            Log::error('Standalone audio transcription failed', [
                'audio_transcription_id' => $record->id,
                'message' => $exception->getMessage(),
            ]);

            $record->update([
                'status' => TranscriptionStatus::Failed->value,
                'error_message' => $exception->getMessage(),
            ]);

            throw $exception;
        } finally {
            $storage->delete($this->audioPath);
        }
    }

    private function transcribeForScreening(
        MistralTranscriptionClient $transcriptionClient,
        SignedStorageUrlService $storage,
        TextContentLimiter $textContentLimiter,
        PlanFeatures $planFeatures,
    ): void {
        $round = InterviewRound::query()->find($this->interviewRoundId);
        $candidate = Candidate::query()->with('team')->find($this->candidateId);

        if ($round === null || $candidate === null) {
            return;
        }

        $round->update(['transcription_status' => TranscriptionStatus::Processing->value]);
        $candidate->update(['status' => CandidateStatus::Processing]);

        try {
            $result = $this->runTranscription($transcriptionClient, $storage);
            $limited = $textContentLimiter->limitTranscriptText($result['text']);

            $round->update([
                'transcript_text' => $limited['text'],
                'was_truncated' => $limited['was_truncated'],
                'audio_path' => null,
                'transcription_status' => TranscriptionStatus::Complete->value,
            ]);

            $queue = $planFeatures->can($candidate->team, 'priority_queue')
                ? config('certalytic.queues.priority')
                : config('certalytic.queues.default');

            ProcessCandidateScreeningJob::dispatch($candidate->fresh())
                ->onQueue($queue);
        } catch (Throwable $exception) {
            Log::error('Screening audio transcription failed', [
                'candidate_id' => $candidate->id,
                'interview_round_id' => $round->id,
                'message' => $exception->getMessage(),
            ]);

            $round->update(['transcription_status' => TranscriptionStatus::Failed->value]);
            $candidate->update([
                'status' => CandidateStatus::Failed,
                'error_message' => 'Audio transcription failed. Please retry with a shorter file or paste the transcript manually.',
            ]);

            throw $exception;
        } finally {
            $storage->delete($this->audioPath);
        }
    }

    /**
     * @return array{
     *     text: string,
     *     duration_seconds: ?int,
     *     segments: list<array{speaker_id: string, text: string, start: ?float, end: ?float}>,
     *     speaker_labels: array<string, string>
     * }
     */
    private function runTranscription(
        MistralTranscriptionClient $transcriptionClient,
        SignedStorageUrlService $storage,
    ): array {
        $contents = $storage->get($this->audioPath);

        if ($contents === null) {
            throw new \RuntimeException('Audio file not found in storage.');
        }

        $extension = pathinfo($this->audioPath, PATHINFO_EXTENSION) ?: 'mp3';
        $tempPath = tempnam(sys_get_temp_dir(), 'certalytic-audio-').".{$extension}";

        try {
            if (file_put_contents($tempPath, $contents) === false) {
                throw new \RuntimeException('Unable to prepare audio for transcription.');
            }

            $maxDurationSeconds = config('certalytic.limits.audio_max_duration_minutes') * 60;
            $durationSeconds = $this->estimateAudioDurationSeconds($tempPath);

            if ($durationSeconds !== null && $durationSeconds > $maxDurationSeconds) {
                throw new \RuntimeException(
                    'Audio exceeds the maximum length of '.config('certalytic.limits.audio_max_duration_minutes').' minutes.',
                );
            }

            return $transcriptionClient->transcribe($tempPath, basename($this->audioPath));
        } finally {
            @unlink($tempPath);
        }
    }

    private function estimateAudioDurationSeconds(string $absolutePath): ?int
    {
        $output = [];
        $exitCode = 0;
        @exec('ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 '.escapeshellarg($absolutePath).' 2>/dev/null', $output, $exitCode);

        if ($exitCode !== 0 || ! isset($output[0]) || ! is_numeric($output[0])) {
            return null;
        }

        return (int) ceil((float) $output[0]);
    }
}
