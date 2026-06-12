<?php

use App\Models\Candidate;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    $response->assertOk();
});

test('dashboard shares token usage and team context for stitch layout', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    $this
        ->actingAs($user)
        ->get(route('dashboard', $team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tokenUsage')
            ->has('teams')
            ->has('currentTeam')
            ->where('currentTeam.id', $team->id)
            ->has('tokenUsage.available'));
});

test('dashboard paginates recent screenings', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Candidate::factory()->count(12)->for($team)->create();

    $this
        ->actingAs($user)
        ->get(route('dashboard', $team).'?per_page=5&page=2')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recentScreenings.data', 5)
            ->where('recentScreenings.current_page', 2)
            ->where('filters.per_page', 5));
});

test('dashboard searches recent screenings by candidate name', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    Candidate::factory()->for($team)->create(['name' => 'Alice Johnson']);
    Candidate::factory()->for($team)->create(['name' => 'Bob Smith']);

    $this
        ->actingAs($user)
        ->get(route('dashboard', $team).'?search=alice')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('recentScreenings.data', 1)
            ->where('recentScreenings.data.0.name', 'Alice Johnson')
            ->where('filters.search', 'alice'));
});
