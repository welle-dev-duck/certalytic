<?php

use App\Models\User;
use App\Services\RateLimiting\SlidingWindowRateLimiter;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * @param  'login'|'register'|'password-reset'|'authenticated'|'screening'|'transcription'  $limiter
 */
function seedRateLimiter(string $key, string $limiter): void
{
    $config = config("certalytic.rate_limits.{$limiter}");
    $rateLimiter = app(SlidingWindowRateLimiter::class);

    for ($attempt = 0; $attempt < $config['max_attempts']; $attempt++) {
        $rateLimiter->hit($key, $config['decay_seconds']);
    }
}

test('login attempts are rate limited by ip using a sliding window', function () {
    $user = User::factory()->create();

    seedRateLimiter('login:127.0.0.1', 'login');

    $response = $this->post(route('login.store'), [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertTooManyRequests();
});

test('register attempts are rate limited by ip using a sliding window', function () {
    seedRateLimiter('register:127.0.0.1', 'register');

    $response = $this->post(route('register.store'), [
        'name' => 'New User',
        'email' => 'new-user@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $response->assertTooManyRequests();
});

test('password reset requests are rate limited by ip using a sliding window', function () {
    seedRateLimiter('password-reset:127.0.0.1', 'password-reset');

    $response = $this->post(route('password.email'), [
        'email' => 'someone@example.com',
    ]);

    $response->assertTooManyRequests();
});

test('authenticated routes are rate limited per user id using a sliding window', function () {
    $user = User::factory()->create();

    seedRateLimiter("authenticated:user:{$user->id}", 'authenticated');

    $response = $this->actingAs($user)->get(route('dashboard', $user->currentTeam));

    $response->assertTooManyRequests();
});

test('screening submissions are rate limited per user id using a sliding window', function () {
    $user = User::factory()->create();
    $team = $user->currentTeam;

    seedRateLimiter("screening:user:{$user->id}", 'screening');

    $response = $this->actingAs($user)->post(route('candidates.store', $team), [
        'name' => 'Jane Doe',
    ]);

    $response->assertTooManyRequests();
});

test('transcription uploads are rate limited per user id using a sliding window', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $team = $user->currentTeam;

    seedRateLimiter("transcription:user:{$user->id}", 'transcription');

    $response = $this->actingAs($user)->post(route('tools.transcribe', $team), [
        'audio' => UploadedFile::fake()->create('meeting.mp3', 100, 'audio/mpeg'),
    ]);

    $response->assertTooManyRequests();
});

test('authenticated rate limits are isolated per user', function () {
    $limitedUser = User::factory()->create();
    $otherUser = User::factory()->create();

    seedRateLimiter("authenticated:user:{$limitedUser->id}", 'authenticated');

    $this->actingAs($limitedUser)
        ->get(route('dashboard', $limitedUser->currentTeam))
        ->assertTooManyRequests();

    $this->actingAs($otherUser)
        ->get(route('dashboard', $otherUser->currentTeam))
        ->assertOk();
});
