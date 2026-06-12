<?php

namespace App\Http\Controllers\Transcriptions;

use App\Http\Controllers\Controller;
use App\Models\AudioTranscription;
use App\Models\Team;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\TranscriptFormatter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TranscriptionController extends Controller
{
    private const PAGE_SIZES = [10, 25, 50];

    public function index(Request $request, Team $current_team): Response
    {
        $this->ensureMember($current_team);

        $search = trim((string) $request->string('search'));
        $perPage = $this->resolvePerPage($request);

        $query = $current_team->audioTranscriptions()->latest();

        if ($search !== '') {
            $term = '%'.mb_strtolower($search).'%';
            $query->where(function ($builder) use ($term, $search): void {
                $builder
                    ->whereRaw('LOWER(original_filename) LIKE ?', [$term])
                    ->orWhereRaw('CAST(id AS TEXT) LIKE ?', ['%'.$search.'%']);
            });
        }

        $transcriptions = $query
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (AudioTranscription $transcription) => [
                'id' => $transcription->id,
                'status' => $transcription->status->value,
                'original_filename' => $transcription->original_filename,
                'duration_seconds' => $transcription->duration_seconds,
                'created_at' => $transcription->created_at?->toIso8601String(),
            ]);

        return Inertia::render('transcriptions/index', [
            'transcriptions' => $transcriptions,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
            ],
            'pageSizes' => self::PAGE_SIZES,
        ]);
    }

    public function show(Team $current_team, AudioTranscription $transcription): Response
    {
        $this->ensureMember($current_team);
        $this->ensureBelongsToTeam($current_team, $transcription);

        return Inertia::render('transcriptions/show', [
            'transcription' => [
                'id' => $transcription->id,
                'status' => $transcription->status->value,
                'original_filename' => $transcription->original_filename,
                'transcript_text' => $transcription->transcript_text,
                'error_message' => $transcription->error_message,
                'duration_seconds' => $transcription->duration_seconds,
                'speaker_labels' => $transcription->speaker_labels ?? [],
                'segments' => $transcription->segments ?? [],
                'created_at' => $transcription->created_at?->toIso8601String(),
                'updated_at' => $transcription->updated_at?->toIso8601String(),
            ],
        ]);
    }

    public function updateSpeakers(
        Request $request,
        Team $current_team,
        AudioTranscription $transcription,
        TranscriptFormatter $formatter,
    ): RedirectResponse {
        $this->ensureMember($current_team);
        $this->ensureBelongsToTeam($current_team, $transcription);

        /** @var array<string, string> $validated */
        $validated = $request->validate([
            'speaker_labels' => ['required', 'array'],
            'speaker_labels.*' => ['required', 'string', 'max:100'],
        ]);

        $segments = is_array($transcription->segments) ? $transcription->segments : [];

        if ($segments === []) {
            return back()->withErrors(['speaker_labels' => 'No speaker segments are available for this transcription.']);
        }

        $transcription->update([
            'speaker_labels' => $validated['speaker_labels'],
            'transcript_text' => $formatter->formatSegments($segments, $validated['speaker_labels']),
        ]);

        return back()->with('success', 'Speaker labels updated.');
    }

    public function destroy(
        Team $current_team,
        AudioTranscription $transcription,
        SignedStorageUrlService $storage,
    ): RedirectResponse {
        $this->ensureMember($current_team);
        $this->ensureBelongsToTeam($current_team, $transcription);

        if ($transcription->audio_path !== null) {
            $storage->delete($transcription->audio_path);
        }

        $transcription->delete();

        return redirect()
            ->route('transcriptions.index', $current_team)
            ->with('success', 'Transcription deleted.');
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = $request->integer('per_page');

        return in_array($perPage, self::PAGE_SIZES, true) ? $perPage : 10;
    }

    private function ensureMember(Team $team): void
    {
        abort_unless(
            request()->user()?->teams()->where('teams.id', $team->id)->exists(),
            403,
        );
    }

    private function ensureBelongsToTeam(Team $team, AudioTranscription $transcription): void
    {
        abort_unless($transcription->team_id === $team->id, 404);
    }
}
