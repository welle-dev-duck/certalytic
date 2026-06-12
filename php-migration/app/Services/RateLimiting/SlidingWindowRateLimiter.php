<?php

namespace App\Services\RateLimiting;

use Illuminate\Support\Facades\Cache;

class SlidingWindowRateLimiter
{
    /**
     * Determine if the key has exceeded the maximum attempts within the decay window.
     */
    public function tooManyAttempts(string $key, int $maxAttempts, int $decaySeconds): bool
    {
        return $this->attempts($key, $decaySeconds) >= $maxAttempts;
    }

    /**
     * Record an attempt and return the new attempt count.
     */
    public function hit(string $key, int $decaySeconds): int
    {
        $now = microtime(true);
        $attempts = $this->pruneAttempts($this->getAttempts($key), $now, $decaySeconds);
        $attempts[] = $now;

        Cache::put($this->cacheKey($key), $attempts, $decaySeconds);

        return count($attempts);
    }

    /**
     * Get the number of attempts within the decay window.
     */
    public function attempts(string $key, int $decaySeconds): int
    {
        $now = microtime(true);

        return count($this->pruneAttempts($this->getAttempts($key), $now, $decaySeconds));
    }

    /**
     * Get the number of seconds until the oldest attempt falls outside the window.
     */
    public function availableIn(string $key, int $decaySeconds): int
    {
        $now = microtime(true);
        $attempts = $this->pruneAttempts($this->getAttempts($key), $now, $decaySeconds);

        if ($attempts === []) {
            return 0;
        }

        $oldest = min($attempts);

        return max(0, (int) ceil(($oldest + $decaySeconds) - $now));
    }

    /**
     * @return array<int, float>
     */
    private function getAttempts(string $key): array
    {
        /** @var array<int, float>|null $attempts */
        $attempts = Cache::get($this->cacheKey($key));

        return is_array($attempts) ? $attempts : [];
    }

    /**
     * @param  array<int, float>  $attempts
     * @return array<int, float>
     */
    private function pruneAttempts(array $attempts, float $now, int $decaySeconds): array
    {
        $windowStart = $now - $decaySeconds;

        return array_values(array_filter(
            $attempts,
            static fn (float $timestamp): bool => $timestamp > $windowStart,
        ));
    }

    private function cacheKey(string $key): string
    {
        return 'rate:sliding:'.$key;
    }
}
