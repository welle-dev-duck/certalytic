<?php

use App\Models\AudioTranscription;
use App\Models\User;
use App\Services\Mistral\MistralTranscriptionClient;
use Illuminate\Support\Facades\Http;

test('transcriptions index lists team transcriptions with pagination', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    AudioTranscription::factory()->count(3)->for($team)->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->get(route('transcriptions.index', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('transcriptions/index')
            ->has('transcriptions.data', 3)
            ->has('filters')
            ->has('pageSizes'));
});

test('transcriptions index can search by filename', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    AudioTranscription::factory()->for($team)->create([
        'user_id' => $user->id,
        'original_filename' => 'panel-interview.mp3',
    ]);

    AudioTranscription::factory()->for($team)->create([
        'user_id' => $user->id,
        'original_filename' => 'other-call.wav',
    ]);

    $this->actingAs($user)
        ->get(route('transcriptions.index', [$team, 'search' => 'panel']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('transcriptions.data', 1)
            ->where('transcriptions.data.0.original_filename', 'panel-interview.mp3'));
});

test('transcription show displays speaker-labelled transcript', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $transcription = AudioTranscription::factory()->for($team)->create([
        'user_id' => $user->id,
        'transcript_text' => "Hans: Welcome.\nCandidate: Thank you.",
        'speaker_labels' => [
            'speaker_0' => 'Hans',
            'speaker_1' => 'Candidate',
        ],
    ]);

    $this->actingAs($user)
        ->get(route('transcriptions.show', [$team, $transcription]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('transcriptions/show')
            ->where('transcription.id', $transcription->id)
            ->where('transcription.transcript_text', "Hans: Welcome.\nCandidate: Thank you.")
            ->where('transcription.speaker_labels.speaker_0', 'Hans'));
});

test('transcription speaker labels can be updated', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $transcription = AudioTranscription::factory()->for($team)->create([
        'user_id' => $user->id,
        'segments' => [
            ['speaker_id' => 'speaker_0', 'text' => 'Hello.', 'start' => 0.0, 'end' => 1.0],
            ['speaker_id' => 'speaker_1', 'text' => 'Hi.', 'start' => 1.1, 'end' => 2.0],
        ],
        'speaker_labels' => [
            'speaker_0' => 'Speaker 1',
            'speaker_1' => 'Speaker 2',
        ],
        'transcript_text' => "Speaker 1: Hello.\nSpeaker 2: Hi.",
    ]);

    $this->actingAs($user)
        ->patch(route('transcriptions.speakers.update', [$team, $transcription]), [
            'speaker_labels' => [
                'speaker_0' => 'Hans',
                'speaker_1' => 'Maria',
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $transcription->refresh();

    expect($transcription->speaker_labels)->toBe([
        'speaker_0' => 'Hans',
        'speaker_1' => 'Maria',
    ]);
    expect($transcription->transcript_text)->toBe("Hans: Hello.\nMaria: Hi.");
});

test('mistral transcription client prefers diarized segments over plain text', function () {
    config([
        'certalytic.mistral.api_key' => 'test-key',
        'certalytic.mistral.base_url' => 'https://api.mistral.ai/v1',
        'certalytic.mistral.transcription_model' => 'voxtral-mini-latest',
    ]);

    Http::fake([
        'api.mistral.ai/v1/audio/transcriptions' => Http::response([
            'text' => 'Plain combined text without speakers.',
            'duration' => 42,
            'segments' => [
                ['speaker_id' => 'speaker_0', 'text' => 'Question one.', 'start' => 0.0, 'end' => 2.0],
                ['speaker_id' => 'speaker_1', 'text' => 'Answer one.', 'start' => 2.1, 'end' => 5.0],
            ],
        ]),
    ]);

    $client = app(MistralTranscriptionClient::class);
    $path = sys_get_temp_dir().'/certalytic-audio-test.mp3';
    file_put_contents($path, 'fake-audio');

    $result = $client->transcribe($path, 'test.mp3');

    unlink($path);

    expect($result['text'])->toBe("Speaker 1: Question one.\nSpeaker 2: Answer one.");
    expect($result['speaker_labels'])->toHaveKeys(['speaker_0', 'speaker_1']);
    expect($result['duration_seconds'])->toBe(42);
});

test('transcription can be deleted', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $transcription = AudioTranscription::factory()->for($team)->create([
        'user_id' => $user->id,
    ]);

    $this->actingAs($user)
        ->delete(route('transcriptions.destroy', [$team, $transcription]))
        ->assertRedirect(route('transcriptions.index', $team))
        ->assertSessionHas('success');

    expect(AudioTranscription::query()->find($transcription->id))->toBeNull();
});

test('home page renders marketing welcome screen', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('welcome'));
});
