<?php

namespace App\Http\Middleware;

use App\Services\RateLimiting\SlidingWindowRateLimiter;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThrottleSlidingWindow
{
    public function __construct(private SlidingWindowRateLimiter $rateLimiter) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string $limiter = 'authenticated'): Response
    {
        /** @var array{max_attempts: int, decay_seconds: int, by: string}|null $config */
        $config = config("certalytic.rate_limits.{$limiter}");

        if ($config === null) {
            return $next($request);
        }

        $key = $this->resolveKey($request, $config['by'], $limiter);

        if ($this->rateLimiter->tooManyAttempts($key, $config['max_attempts'], $config['decay_seconds'])) {
            return $this->buildResponse($request, $key, $config['decay_seconds']);
        }

        $this->rateLimiter->hit($key, $config['decay_seconds']);

        return $next($request);
    }

    private function resolveKey(Request $request, string $by, string $limiter): string
    {
        return match ($by) {
            'ip' => $limiter.':'.$request->ip(),
            'user' => $limiter.':user:'.($request->user()?->id ?? $request->ip()),
            default => $limiter.':'.$request->ip(),
        };
    }

    private function buildResponse(Request $request, string $key, int $decaySeconds): Response
    {
        $retryAfter = $this->rateLimiter->availableIn($key, $decaySeconds);
        $message = "Too many requests. Please try again in {$retryAfter} seconds.";

        if ($request->expectsJson() || $request->header('X-Inertia')) {
            return new JsonResponse([
                'message' => $message,
            ], 429, [
                'Retry-After' => (string) $retryAfter,
            ]);
        }

        return redirect()
            ->back()
            ->with('toast', [
                'type' => 'error',
                'message' => $message,
            ])
            ->setStatusCode(429);
    }
}
