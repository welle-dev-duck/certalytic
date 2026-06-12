<?php

use App\Services\HttpPublicProfileFetcher;
use Illuminate\Support\Facades\Http;

test('fetches github profile text from the public api', function () {
    Http::fake([
        'api.github.com/users/octocat' => Http::response([
            'login' => 'octocat',
            'name' => 'The Octocat',
            'bio' => 'GitHub mascot',
            'company' => '@github',
            'location' => 'San Francisco',
            'public_repos' => 8,
            'followers' => 9000,
            'created_at' => '2011-01-25T18:44:36Z',
        ]),
    ]);

    $result = (new HttpPublicProfileFetcher)->fetch(null, 'octocat');

    expect($result['github_text'])->toContain('octocat');
    expect($result['github_text'])->toContain('The Octocat');
    expect($result['linkedin_text'])->toBeNull();
});

test('returns null for linkedin without fabricating profile text', function () {
    $result = (new HttpPublicProfileFetcher)->fetch('https://linkedin.com/in/jane-doe', null);

    expect($result['linkedin_text'])->toBeNull();
});
