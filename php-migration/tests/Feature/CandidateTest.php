<?php

use App\Enums\CandidateStatus;
use App\Enums\Plan;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @return array<string, mixed>
 */
function candidateStorePayload(Team $team, array $overrides = []): array
{
    $role = Role::factory()->for($team)->create();

    return array_merge([
        'name' => 'Jane Doe',
        'role_id' => $role->id,
        'cv_input_mode' => 'auto',
        'cv' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'transcript_input_mode' => 'manual',
        'transcripts' => [
            'Interviewer: Hello.'."\n".'Candidate: Hi.',
        ],
    ], $overrides);
}

test('candidates index can be rendered', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('candidates.index', $user->currentTeam));

    $response->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('screenings/index')
            ->has('tokenUsage.included_quota')
            ->has('tokenUsage.included_used')
            ->has('tokenUsage.available'));
});

test('reports index filters candidates by name, email, or role', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Candidate::factory()->for($team)->create([
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
        'role' => 'Backend Engineer',
    ]);
    Candidate::factory()->for($team)->create([
        'name' => 'Grace Hopper',
        'email' => 'grace@example.com',
        'role' => 'Compiler Architect',
    ]);

    $this->actingAs($user)
        ->get(route('candidates.index', [$team, 'search' => 'lovelace']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('screenings/index')
            ->where('filters.search', 'lovelace')
            ->has('candidates.data', 1)
            ->where('candidates.data.0.name', 'Ada Lovelace'));

    $this->actingAs($user)
        ->get(route('candidates.index', [$team, 'search' => 'compiler']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('candidates.data', 1)
            ->where('candidates.data.0.name', 'Grace Hopper'));

    $this->actingAs($user)
        ->get(route('candidates.index', [$team, 'search' => 'grace@example.com']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('candidates.data', 1)
            ->where('candidates.data.0.email', 'grace@example.com'));
});

test('reports index paginates candidates server side', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Candidate::factory()->for($team)->count(15)->create();

    $this->actingAs($user)
        ->get(route('candidates.index', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('candidates.data', 10)
            ->where('candidates.total', 15)
            ->where('candidates.last_page', 2)
            ->where('candidates.per_page', 10));
});

test('candidate can be created and screened', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $response = $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'email' => 'jane@example.com',
        'transcripts' => [
            'Interviewer: Tell me about your experience.'."\n".'Candidate: I built Laravel apps for five years.',
        ],
    ]));

    $candidate = Candidate::first();

    expect($candidate)->not->toBeNull();
    expect($candidate->status)->toBe(CandidateStatus::Complete);
    expect($candidate->integrity_score)->not->toBeNull();

    $response->assertRedirect(route('candidates.show', [$team, $candidate]));
});

test('candidate can be created with manual cv text', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'name' => 'Manual CV Candidate',
        'cv_input_mode' => 'manual',
        'cv' => null,
        'cv_text' => str_repeat('Senior Laravel engineer with distributed systems experience. ', 5),
        'transcripts' => [
            'Interviewer: Describe your stack.'."\n".'Candidate: Laravel, PostgreSQL, Redis.',
        ],
    ]))->assertRedirect();

    $candidate = Candidate::first();

    expect($candidate)->not->toBeNull();
    expect($candidate->cv_text)->not->toBeNull();
    expect($candidate->cv_path)->toBeNull();
    expect($candidate->status)->toBe(CandidateStatus::Complete);
});

test('candidate creation rejects oversized cv uploads', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $maxKb = config('certalytic.limits.cv_max_kilobytes');

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'cv' => UploadedFile::fake()->create('resume.md', $maxKb + 1, 'text/markdown'),
    ]))->assertSessionHasErrors('cv');
});

test('candidate creation rejects audio transcript uploads', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'transcript_input_mode' => 'auto',
        'transcripts' => null,
        'transcript_files' => [
            UploadedFile::fake()->create('meeting.mp3', 100, 'audio/mpeg'),
        ],
    ]))->assertSessionHasErrors('transcript_files.0');
});

test('candidate can be created with uploaded vtt transcript', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nInterviewer: Hello.\n\n00:00:04.000 --> 00:00:06.000\nCandidate: Hi there.\n";

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'transcript_input_mode' => 'auto',
        'transcripts' => null,
        'transcript_files' => [
            UploadedFile::fake()->createWithContent('interview.vtt', $vtt, 'text/vtt'),
        ],
    ]))->assertRedirect();

    $candidate = Candidate::first();

    expect($candidate)->not->toBeNull();
    expect($candidate->interviewRounds()->first()?->transcript_text)->toContain('Interviewer: Hello.');
});

test('candidate creation merges up to three uploaded transcript files', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $vttOne = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nInterviewer: Round one.\n\n00:00:04.000 --> 00:00:06.000\nCandidate: Answer one.\n";
    $vttTwo = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nInterviewer: Round two.\n\n00:00:04.000 --> 00:00:06.000\nCandidate: Answer two.\n";
    $vttThree = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nInterviewer: Round three.\n\n00:00:04.000 --> 00:00:06.000\nCandidate: Answer three.\n";

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'name' => 'Multi Transcript Candidate',
        'transcript_input_mode' => 'auto',
        'transcripts' => null,
        'transcript_files' => [
            UploadedFile::fake()->createWithContent('round-one.vtt', $vttOne, 'text/vtt'),
            UploadedFile::fake()->createWithContent('round-two.vtt', $vttTwo, 'text/vtt'),
            UploadedFile::fake()->createWithContent('round-three.vtt', $vttThree, 'text/vtt'),
        ],
    ]))->assertRedirect();

    $candidate = Candidate::first();

    expect($candidate)->not->toBeNull();
    expect($candidate->interviewRounds)->toHaveCount(1);
    expect($candidate->interviewRounds->first()?->transcript_text)
        ->toContain('--- Interview transcript 1 ---')
        ->toContain('--- Interview transcript 2 ---')
        ->toContain('--- Interview transcript 3 ---');
});

test('candidate creation rejects more than three uploaded transcript files', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $vtt = "WEBVTT\n\n00:00:01.000 --> 00:00:03.000\nInterviewer: Hello.\n\n00:00:04.000 --> 00:00:06.000\nCandidate: Hi.\n";

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'name' => 'Too Many Transcripts',
        'transcript_input_mode' => 'auto',
        'transcripts' => null,
        'transcript_files' => [
            UploadedFile::fake()->createWithContent('one.vtt', $vtt, 'text/vtt'),
            UploadedFile::fake()->createWithContent('two.vtt', $vtt, 'text/vtt'),
            UploadedFile::fake()->createWithContent('three.vtt', $vtt, 'text/vtt'),
            UploadedFile::fake()->createWithContent('four.vtt', $vtt, 'text/vtt'),
        ],
    ]))->assertSessionHasErrors('transcript_files');
});

test('candidate creation fails when tokens exhausted', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $balance = $team->tokenBalance;

    $balance->update(['included_used' => 3]);

    $response = $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'transcripts' => [
            'Interviewer: Hello.'."\n".'Candidate: Hi there.',
        ],
    ]));

    $response->assertSessionHasErrors('tokens');
});

test('user cannot view another teams candidate', function () {
    $user = User::factory()->create();
    $otherTeam = Team::factory()->create();
    $candidate = Candidate::factory()->for($otherTeam)->create();

    $this->actingAs($user)
        ->get(route('candidates.show', [$user->currentTeam, $candidate]))
        ->assertForbidden();
});

test('cross source url fields rejected on all plans', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $response = $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'linkedin_url' => 'https://linkedin.com/in/jane',
    ]));

    $response->assertSessionHasErrors('linkedin_url');
});

test('manual cross source fields rejected on free plan', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'linkedin_text' => 'Senior engineer at Acme Corp with 10 years experience.',
    ]))->assertSessionHasErrors('linkedin_text');
});

test('starter plan allows manual cross source paste', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'linkedin_text' => 'Jane Doe - Staff Engineer at Acme Corp.',
    ]))->assertRedirect();

    expect(Candidate::first()->linkedin_text)->toContain('Staff Engineer');
});

test('starter plan allows linkedin profile urls', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'linkedin_url' => 'https://linkedin.com/in/jane',
    ]))->assertRedirect();

    expect(Candidate::first()->linkedin_url)->toBe('https://linkedin.com/in/jane');
});

test('candidate stores interviewer notes per transcript', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'interviewer_notes' => [
            'Candidate seemed hesitant on system design follow-ups.',
        ],
    ]))->assertRedirect();

    expect(Candidate::first()->interviewRounds->first()->interviewer_notes)
        ->toContain('hesitant on system design');
});

test('growth plan allows linkedin profile urls', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'linkedin_url' => 'https://linkedin.com/in/jane',
    ]))->assertRedirect();

    expect(Candidate::first()->linkedin_url)->toBe('https://linkedin.com/in/jane');
});

test('github profile urls rejected on free plan', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'github_url' => 'https://github.com/janedoe',
    ]))->assertSessionHasErrors('github_url');
});

test('starter plan allows github profile urls', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $this->actingAs($user)->post(route('candidates.store', $team), candidateStorePayload($team, [
        'github_url' => 'https://github.com/janedoe',
    ]))->assertRedirect();

    expect(Candidate::first()->github_username)->toBe('janedoe');
});

test('candidate can be deleted from screenings list', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $candidate = Candidate::factory()->for($team)->create([
        'cv_path' => 'cvs/test-cv.pdf',
    ]);

    Storage::put('cvs/test-cv.pdf', 'cv content');

    $this->actingAs($user)
        ->from(route('candidates.index', $team))
        ->delete(route('candidates.destroy', [$team, $candidate]))
        ->assertRedirect(route('candidates.index', $team));

    expect(Candidate::find($candidate->id))->toBeNull();
    Storage::assertMissing('cvs/test-cv.pdf');
});

test('candidate name cannot exceed configured max length', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $max = config('certalytic.limits.name_max_characters');

    $this->actingAs($user)
        ->post(route('candidates.store', $team), candidateStorePayload($team, [
            'name' => str_repeat('a', $max + 1),
        ]))
        ->assertSessionHasErrors('name');
});

test('legacy screenings index redirects to candidates', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)
        ->get("/{$team->slug}/screenings")
        ->assertRedirect(route('candidates.index', $team));
});

test('candidate cannot be deleted by a user outside the team', function () {
    $owner = User::factory()->create();
    $team = $owner->currentTeam;
    $candidate = Candidate::factory()->for($team)->create();

    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->delete(route('candidates.destroy', [$team, $candidate]))
        ->assertForbidden();

    expect(Candidate::find($candidate->id))->not->toBeNull();
});

test('complete candidate integrity dossier can be exported as pdf', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $candidate = Candidate::factory()->for($team)->complete()->create();

    $response = $this->actingAs($user)
        ->get(route('candidates.export', [$team, $candidate]));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
    expect($response->headers->get('content-disposition'))->toContain('integrity-dossier.pdf');
});

test('processing candidate cannot export integrity dossier pdf', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $candidate = Candidate::factory()->for($team)->processing()->create();

    $this->actingAs($user)
        ->get(route('candidates.export', [$team, $candidate]))
        ->assertStatus(422);
});

test('free plan exports include heavier certalytic watermark flag path', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Free]);
    $candidate = Candidate::factory()->for($team)->complete()->create();

    $this->actingAs($user)
        ->get(route('candidates.export', [$team, $candidate]))
        ->assertOk();
});
