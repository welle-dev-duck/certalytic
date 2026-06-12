<?php

use App\Models\User;

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'accept_terms' => '1',
        'accept_privacy' => '1',
        'accept_dpa' => '1',
    ]);

    $this->assertAuthenticated();

    $user = User::where('email', 'test@example.com')->first();
    $response->assertRedirect(route('dashboard'));
});

test('registration requires legal consents', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'reject@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertSessionHasErrors(['accept_terms', 'accept_privacy', 'accept_dpa']);
    expect(User::where('email', 'reject@example.com')->exists())->toBeFalse();
});