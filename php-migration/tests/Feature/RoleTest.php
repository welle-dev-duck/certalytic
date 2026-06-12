<?php

use App\Enums\Plan;
use App\Enums\RoleExportStatus;
use App\Jobs\GenerateRoleExportPdfJob;
use App\Models\Candidate;
use App\Models\Role;
use App\Models\RoleExport;
use App\Models\User;
use App\Services\RoleExportPdfGenerator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

test('roles index is available on free plan', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('roles.index', $user->currentTeam))
        ->assertOk();
});

test('starter plan can view and create roles', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $this->actingAs($user)
        ->get(route('roles.index', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('roles/index'));

    $this->actingAs($user)
        ->post(route('roles.store', $team), [
            'title' => 'Support Lead',
            'description' => 'Customer support team lead.',
        ])
        ->assertRedirect();

    $role = Role::first();

    expect($role)->not->toBeNull();
    expect($role->title)->toBe('Support Lead');
});

test('role show page displays role and linked candidates', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $role = Role::factory()->for($team)->create([
        'title' => 'Backend Engineer',
        'description' => 'Build APIs and services.',
    ]);

    $candidate = Candidate::factory()->for($team)->create([
        'role_id' => $role->id,
        'role' => 'Backend Engineer',
        'name' => 'Jamie Lee',
    ]);

    $this->actingAs($user)
        ->get(route('roles.show', [$team, $role]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('roles/show')
            ->where('role.title', 'Backend Engineer')
            ->where('role.description', 'Build APIs and services.')
            ->has('candidates.data', 1)
            ->where('candidates.data.0.id', $candidate->id)
            ->where('candidates.data.0.name', 'Jamie Lee')
            ->has('tokenUsage'));
});

test('role show page filters candidates by name or email', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $role = Role::factory()->for($team)->create();

    Candidate::factory()->for($team)->create([
        'role_id' => $role->id,
        'name' => 'Ada Lovelace',
        'email' => 'ada@example.com',
    ]);
    Candidate::factory()->for($team)->create([
        'role_id' => $role->id,
        'name' => 'Grace Hopper',
        'email' => 'grace@example.com',
    ]);

    $this->actingAs($user)
        ->get(route('roles.show', [$team, $role, 'search' => 'lovelace']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('filters.search', 'lovelace')
            ->has('candidates.data', 1)
            ->where('candidates.data.0.name', 'Ada Lovelace'));

    $this->actingAs($user)
        ->get(route('roles.show', [$team, $role, 'search' => 'grace@example.com']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('candidates.data', 1)
            ->where('candidates.data.0.email', 'grace@example.com'));
});

test('growth plan can view and create roles', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $this->actingAs($user)
        ->get(route('roles.index', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('roles/index'));

    $this->actingAs($user)
        ->post(route('roles.store', $team), [
            'title' => 'Senior React Engineer',
            'description' => 'Own frontend architecture and mentor engineers.',
        ])
        ->assertRedirect();

    $role = Role::first();

    expect($role)->not->toBeNull();
    expect($role->title)->toBe('Senior React Engineer');
    expect($role->team_id)->toBe($team->id);
});

test('growth plan can screen candidate against saved role', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $role = Role::factory()->for($team)->create([
        'title' => 'Staff Engineer',
        'description' => 'Deep systems design experience required.',
    ]);

    $this->actingAs($user)->post(route('candidates.store', $team), [
        'name' => 'Alex Rivera',
        'role_id' => $role->id,
        'cv_input_mode' => 'auto',
        'cv' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'transcript_input_mode' => 'manual',
        'transcripts' => [
            'Interviewer: Tell me about scaling.'."\n".'Candidate: I led a migration to event-driven services.',
        ],
    ])->assertRedirect();

    $candidate = Candidate::first();

    expect($candidate->role_id)->toBe($role->id);
    expect($candidate->role)->toBe('Staff Engineer');
    expect($candidate->job_description)->toBe('Deep systems design experience required.');
});

test('saved role is required when creating a screening', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this->actingAs($user)->post(route('candidates.store', $team), [
        'name' => 'Alex Rivera',
        'cv_input_mode' => 'auto',
        'cv' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf'),
        'transcript_input_mode' => 'manual',
        'transcripts' => [
            'Interviewer: Hello.'."\n".'Candidate: Hi.',
        ],
    ])->assertSessionHasErrors('role_id');
});

test('scale plan can upload targeted scan document for role', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Scale]);

    $role = Role::factory()->for($team)->create();

    $this->actingAs($user)
        ->post(route('roles.documents.store', [$team, $role]), [
            'document' => UploadedFile::fake()->create('take-home.pdf', 100, 'application/pdf'),
        ])
        ->assertRedirect(route('roles.show', [$team, $role]));

    expect($role->fresh()->documents)->toHaveCount(1);
});

test('growth plan cannot upload role context documents', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $role = Role::factory()->for($team)->create();

    $this->actingAs($user)
        ->post(route('roles.documents.store', [$team, $role]), [
            'document' => UploadedFile::fake()->create('take-home.pdf', 100, 'application/pdf'),
        ])
        ->assertForbidden();
});

test('dashboard preselects role from query string', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Growth]);

    $roleA = Role::factory()->for($team)->create(['title' => 'Role A']);

    $this->actingAs($user)
        ->get(route('dashboard', $team).'?role_id='.$roleA->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('selectedRoleId', $roleA->id)
            ->has('firstName')
            ->has('recentScreenings'));
});

test('role description cannot exceed configured max length', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);
    $max = config('certalytic.limits.role_description_max_characters');

    $this->actingAs($user)
        ->post(route('roles.store', $team), [
            'title' => 'Engineer',
            'description' => str_repeat('a', $max + 1),
        ])
        ->assertSessionHasErrors('description');
});

test('dashboard chart includes completed screenings with scores', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Candidate::factory()->for($team)->complete()->create([
        'integrity_score' => 88,
        'name' => 'Jane Doe',
    ]);

    $this->actingAs($user)
        ->get(route('dashboard', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recentScreenings.data', 1)
            ->where('recentScreenings.data.0.integrity_score', '88.00')
            ->where('recentScreenings.data.0.name', 'Jane Doe'));
});

test('role export request queues pdf generation job', function () {
    Queue::fake();
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);
    $role = Role::factory()->for($team)->create();

    Candidate::factory()->for($team)->complete()->create([
        'role_id' => $role->id,
    ]);

    $this->actingAs($user)
        ->post(route('roles.export', [$team, $role]))
        ->assertRedirect(route('roles.show', [$team, $role]));

    $export = RoleExport::query()->first();

    expect($export)->not->toBeNull();
    expect($export->status)->toBe(RoleExportStatus::Pending);
    expect($export->role_id)->toBe($role->id);

    Queue::assertPushed(GenerateRoleExportPdfJob::class);
});

test('completed role export pdf can be downloaded', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);
    $role = Role::factory()->for($team)->create();

    Candidate::factory()->for($team)->complete()->create([
        'role_id' => $role->id,
        'name' => 'Export Candidate',
    ]);

    $export = RoleExport::query()->create([
        'team_id' => $team->id,
        'role_id' => $role->id,
        'user_id' => $user->id,
        'status' => RoleExportStatus::Pending,
    ]);

    (new GenerateRoleExportPdfJob($export))->handle(app(RoleExportPdfGenerator::class));

    $export->refresh();

    expect($export->status)->toBe(RoleExportStatus::Complete);
    expect($export->path)->not->toBeNull();

    $response = $this->actingAs($user)
        ->get(route('roles.exports.download', [$team, $role, $export]));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
    expect($response->headers->get('content-disposition'))->toContain('role-dossier.pdf');
});

test('duplicate role export while in progress is rejected', function () {
    Queue::fake();

    $user = User::factory()->create();
    $team = $user->currentTeam;
    $role = Role::factory()->for($team)->create();

    RoleExport::query()->create([
        'team_id' => $team->id,
        'role_id' => $role->id,
        'user_id' => $user->id,
        'status' => RoleExportStatus::Processing,
    ]);

    $this->actingAs($user)
        ->post(route('roles.export', [$team, $role]))
        ->assertSessionHasErrors('export');

    Queue::assertNothingPushed();
});

test('role show page includes latest export status', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);
    $role = Role::factory()->for($team)->create();

    RoleExport::query()->create([
        'team_id' => $team->id,
        'role_id' => $role->id,
        'user_id' => $user->id,
        'status' => RoleExportStatus::Processing,
    ]);

    $this->actingAs($user)
        ->get(route('roles.show', [$team, $role]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('latestExport.status', RoleExportStatus::Processing->value));
});
