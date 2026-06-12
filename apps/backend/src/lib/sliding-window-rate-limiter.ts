import type Redis from 'ioredis';

export class SlidingWindowRateLimiter {
  constructor(private readonly redis: Redis) {}

  async tooManyAttempts(
    key: string,
    maxAttempts: number,
    decaySeconds: number,
  ): Promise<boolean> {
    return (await this.attempts(key, decaySeconds)) >= maxAttempts;
  }

  async hit(key: string, decaySeconds: number): Promise<number> {
    const now = Date.now() / 1000;
    const attempts = this.pruneAttempts(
      await this.getAttempts(key),
      now,
      decaySeconds,
    );
    attempts.push(now);

    await this.redis.set(
      this.cacheKey(key),
      JSON.stringify(attempts),
      'EX',
      decaySeconds,
    );

    return attempts.length;
  }

  async attempts(key: string, decaySeconds: number): Promise<number> {
    const now = Date.now() / 1000;

    return this.pruneAttempts(
      await this.getAttempts(key),
      now,
      decaySeconds,
    ).length;
  }

  async availableIn(key: string, decaySeconds: number): Promise<number> {
    const now = Date.now() / 1000;
    const attempts = this.pruneAttempts(
      await this.getAttempts(key),
      now,
      decaySeconds,
    );

    if (attempts.length === 0) {
      return 0;
    }

    const oldest = Math.min(...attempts);

    return Math.max(0, Math.ceil(oldest + decaySeconds - now));
  }

  private async getAttempts(key: string): Promise<number[]> {
    const raw = await this.redis.get(this.cacheKey(key));

    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as unknown;

      return Array.isArray(parsed)
        ? parsed.filter((value): value is number => typeof value === 'number')
        : [];
    } catch {
      return [];
    }
  }

  private pruneAttempts(
    attempts: number[],
    now: number,
    decaySeconds: number,
  ): number[] {
    const windowStart = now - decaySeconds;

    return attempts.filter((timestamp) => timestamp > windowStart);
  }

  private cacheKey(key: string): string {
    return `rate:sliding:${key}`;
  }
}
