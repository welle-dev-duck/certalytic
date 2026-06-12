<?php

namespace App\Http\Controllers\Tools;

use App\Enums\TeamRole;
use App\Enums\TranscriptionStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tools\StoreTranscriptionRequest;
use App\Jobs\TranscribeAudioJob;
use App\Models\AudioTranscription;
use App\Models\Team;
use App\Services\Storage\SignedStorageUrlService;
use App\Services\Storage\StoragePathBuilder;
use App\Services\TranscriptTokenService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ToolsController extends Controller
{
    public function index(Team $current_team): RedirectResponse
    {
        $this->ensureMember($current_team);

        return redirect()->route('tools.transcription', $current_team);
    }

    public function transcription(Team $current_team, TranscriptTokenService $transcriptTokenService): Response
    {
        $this->ensureMember($current_team);

        return Inertia::render('tools/transcription', $this->transcriptionPageProps($current_team, $transcriptTokenService));
    }

    public function transcribe(
        StoreTranscriptionRequest $request,
        Team $current_team,
        TranscriptTokenService $transcriptTokenService,
        StoragePathBuilder $pathBuilder,
        SignedStorageUrlService $storage,
    ): RedirectResponse {
        $this->ensureMember($current_team);

        $file = $request->file('audio');
        $extension = $file->getClientOriginalExtension();
        $audioPath = $pathBuilder->audioForTeam($current_team->id, $extension);
        $storage->put($audioPath, $file->get());

        $transcriptTokenService->consume($current_team);

        $record = $current_team->audioTranscriptions()->create([
            'user_id' => $request->user()->id,
            'status' => TranscriptionStatus::Pending,
            'audio_path' => $audioPath,
            'original_filename' => $file->getClientOriginalName(),
        ]);

        TranscribeAudioJob::dispatch(
            audioPath: $audioPath,
            audioTranscriptionId: $record->id,
        )->onQueue(config('certalytic.queues.transcriptions'));

        return redirect()
            ->route('transcriptions.show', [$current_team, $record])
            ->with('success', 'Audio queued for transcription.');
    }

    public function purchaseToken(Team $current_team): RedirectResponse|SymfonyResponse
    {
        $this->ensureOwner($current_team);

        $priceId = config('certalytic.transcription_pack.stripe_price');

        if (! is_string($priceId) || $priceId === '') {
            return back()->withErrors(['purchase' => 'Transcription packs are not configured yet.']);
        }

        $checkout = $current_team->checkout([$priceId => 1], [
            'success_url' => route('tools.purchase.success', $current_team).'?session_id={CHECKOUT_SESSION_ID}',
            'cancel_url' => route('tools.transcription', $current_team),
            'metadata' => [
                'team_id' => (string) $current_team->id,
                'transcript_pack' => 'single',
            ],
        ]);

        return Inertia::location($checkout->url);
    }

    public function purchaseSuccess(Request $request, Team $current_team, TranscriptTokenService $transcriptTokenService): RedirectResponse
    {
        $this->ensureOwner($current_team);

        $sessionId = $request->string('session_id')->toString();

        if ($sessionId !== '') {
            $session = $current_team->stripe()->checkout->sessions->retrieve($sessionId);
            $metadata = $session->metadata?->toArray() ?? [];
            $teamId = $metadata['team_id'] ?? null;
            $pack = $metadata['transcript_pack'] ?? null;

            if ($teamId === (string) $current_team->id && $pack === 'single') {
                $transcriptTokenService->credit(
                    $current_team,
                    config('certalytic.transcription_pack.tokens'),
                    $sessionId,
                );
            }
        }

        return redirect()
            ->route('tools.transcription', $current_team)
            ->with('success', config('certalytic.transcription_pack.tokens').' transcription tokens added to your team.');
    }

    /**
     * @return array<string, mixed>
     */
    private function transcriptionPageProps(Team $current_team, TranscriptTokenService $transcriptTokenService): array
    {
        return [
            'transcriptTokens' => $transcriptTokenService->available($current_team),
            'audioMaxMinutes' => config('certalytic.limits.audio_max_duration_minutes'),
            'audioMaxMegabytes' => (int) round(config('certalytic.limits.audio_max_kilobytes') / 1024),
            'transcriptionPackTokens' => config('certalytic.transcription_pack.tokens'),
            'transcriptionPackPrice' => config('certalytic.transcription_pack.price'),
            'canPurchaseTokens' => filled(config('certalytic.transcription_pack.stripe_price')),
            'transcriptions' => $current_team->audioTranscriptions()
                ->latest()
                ->limit(5)
                ->get()
                ->map(fn (AudioTranscription $transcription) => [
                    'id' => $transcription->id,
                    'status' => $transcription->status->value,
                    'original_filename' => $transcription->original_filename,
                    'created_at' => $transcription->created_at?->toIso8601String(),
                ])
                ->all(),
        ];
    }

    private function ensureMember(Team $team): void
    {
        abort_unless(
            request()->user()?->teams()->where('teams.id', $team->id)->exists(),
            403,
        );
    }

    private function ensureOwner(Team $team): void
    {
        $user = request()->user();

        abort_unless(
            $user && $team->members()->where('user_id', $user->id)->wherePivot('role', TeamRole::Owner->value)->exists(),
            403,
        );
    }
}
