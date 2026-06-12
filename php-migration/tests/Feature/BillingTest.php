<?php

use App\Enums\Plan;
use App\Enums\TeamRole;
use App\Models\Team;
use App\Models\User;

test('billing page can be rendered by team owner', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('billing.index', $user->currentTeam))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('billing/index')
            ->has('freePlanFeatures')
            ->has('plans', 3)
            ->where('plans.0.value', 'starter')
            ->has('plans.0.features')
            ->where('plans.1.value', 'growth')
            ->has('plans.1.features')
            ->where('plans.2.value', 'scale')
            ->has('plans.2.features'));
});

test('billing page forbidden for non owners', function () {
    $owner = User::factory()->create();
    $team = Team::factory()->create();
    $member = User::factory()->create();

    $team->members()->attach($owner, ['role' => TeamRole::Owner->value]);
    $team->members()->attach($member, ['role' => TeamRole::Member->value]);
    $member->switchTeam($team);

    $this->actingAs($member)
        ->get(route('billing.index', $team))
        ->assertForbidden();
});

test('free plan cannot purchase token packs via controller validation', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    expect($team->plan)->toBe(Plan::Free);

    $this->actingAs($user)->post(route('billing.packs.purchase', $team), [
        'pack' => 'quick_refill',
    ])->assertSessionHasErrors('pack');
});

test('stripe checkout redirects use inertia location for xhr requests', function () {
    $response = inertia_location('https://checkout.stripe.com/c/pay/cs_test');

    expect($response->getStatusCode())->toBe(302);
    expect($response->headers->get('Location'))->toBe('https://checkout.stripe.com/c/pay/cs_test');

    $this->withHeaders(['X-Inertia' => 'true'])
        ->get('/');

    $response = inertia_location('https://checkout.stripe.com/c/pay/cs_test');

    expect($response->getStatusCode())->toBe(409);
    expect($response->headers->get('X-Inertia-Location'))->toBe('https://checkout.stripe.com/c/pay/cs_test');
});

test('starter plan can access token pack purchase endpoint', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;
    $team->update(['plan' => Plan::Starter]);

    $this->actingAs($user)->post(route('billing.packs.purchase', $team), [
        'pack' => 'invalid_pack',
    ])->assertSessionHasErrors('pack');
});
