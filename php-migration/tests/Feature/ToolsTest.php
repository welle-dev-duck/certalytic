<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('tools index redirects to transcription', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('tools.index', $user->currentTeam))
        ->assertRedirect(route('tools.transcription', $user->currentTeam));
});

test('tools transcription page can be rendered', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('tools.transcription', $user->currentTeam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tools/transcription')
            ->has('transcriptTokens')
            ->where('transcriptionPackTokens', 5)
            ->has('transcriptions'));
});

test('signed cv route redirects away when cv exists', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    Storage::disk('local')->put('cvs/1/sample.pdf', 'pdf-content');

    $candidate = $team->candidates()->create([
        'name' => 'Jane Doe',
        'cv_path' => 'cvs/1/sample.pdf',
        'status' => \App\Enums\CandidateStatus::Pending,
    ]);

    $response = $this->actingAs($user)->get(route('candidates.cv', [$team, $candidate]));

    $response->assertRedirect();
    expect($response->headers->get('Location'))->not->toBeNull();
});
