<?php

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

test('requests behind a reverse proxy are treated as secure', function () {
    Route::middleware('web')->get('/__test-secure-check', function (Request $request) {
        return response()->json([
            'secure' => $request->secure(),
            'scheme' => $request->getScheme(),
        ]);
    });

    $this->withHeaders([
        'X-Forwarded-Proto' => 'https',
        'X-Forwarded-For' => '203.0.113.1',
    ])
        ->get('/__test-secure-check')
        ->assertOk()
        ->assertJson([
            'secure' => true,
            'scheme' => 'https',
        ]);
});

test('authenticated post requests work behind a reverse proxy', function () {
    $user = User::factory()->create();

    $this->withHeaders([
        'X-Forwarded-Proto' => 'https',
        'X-Forwarded-For' => '203.0.113.1',
    ])
        ->actingAs($user)
        ->post(route('logout'))
        ->assertRedirect(route('home'));

    $this->assertGuest();
});
