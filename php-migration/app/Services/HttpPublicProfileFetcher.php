<?php

namespace App\Services;

use App\Contracts\PublicProfileFetcher;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HttpPublicProfileFetcher implements PublicProfileFetcher
{
    /**
     * {@inheritdoc}
     */
    public function fetch(?string $linkedinUrl, ?string $githubUsername): array
    {
        return [
            'linkedin_text' => $this->fetchLinkedIn($linkedinUrl),
            'github_text' => $this->fetchGitHub($githubUsername),
        ];
    }

    private function fetchLinkedIn(?string $linkedinUrl): ?string
    {
        if (! is_string($linkedinUrl) || trim($linkedinUrl) === '') {
            return null;
        }

        Log::info('LinkedIn profile text could not be fetched automatically; URL will be passed to evaluation.', [
            'linkedin_url' => $linkedinUrl,
        ]);

        return null;
    }

    private function fetchGitHub(?string $githubUsername): ?string
    {
        if (! is_string($githubUsername) || trim($githubUsername) === '') {
            return null;
        }

        $username = trim($githubUsername);

        try {
            $response = Http::baseUrl('https://api.github.com')
                ->acceptJson()
                ->withHeaders([
                    'User-Agent' => 'Certalytic',
                ])
                ->timeout(15)
                ->get("/users/{$username}");

            if (! $response->successful()) {
                Log::warning('GitHub profile fetch failed.', [
                    'github_username' => $username,
                    'status' => $response->status(),
                ]);

                return null;
            }

            /** @var array<string, mixed> $profile */
            $profile = $response->json();

            return $this->formatGitHubProfile($username, $profile);
        } catch (RequestException $exception) {
            Log::warning('GitHub profile fetch request failed.', [
                'github_username' => $username,
                'message' => $exception->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $profile
     */
    private function formatGitHubProfile(string $username, array $profile): string
    {
        $name = is_string($profile['name'] ?? null) ? $profile['name'] : $username;
        $bio = is_string($profile['bio'] ?? null) && $profile['bio'] !== '' ? $profile['bio'] : 'No bio provided.';
        $publicRepos = is_numeric($profile['public_repos'] ?? null) ? (int) $profile['public_repos'] : 0;
        $followers = is_numeric($profile['followers'] ?? null) ? (int) $profile['followers'] : 0;
        $company = is_string($profile['company'] ?? null) && $profile['company'] !== ''
            ? $profile['company']
            : 'Not listed';
        $location = is_string($profile['location'] ?? null) && $profile['location'] !== ''
            ? $profile['location']
            : 'Not listed';
        $createdAt = is_string($profile['created_at'] ?? null) ? $profile['created_at'] : 'unknown';

        return implode("\n", [
            "GitHub user: {$username}",
            "Display name: {$name}",
            "Bio: {$bio}",
            "Company: {$company}",
            "Location: {$location}",
            "Public repositories: {$publicRepos}",
            "Followers: {$followers}",
            "Account created: {$createdAt}",
        ]);
    }
}
