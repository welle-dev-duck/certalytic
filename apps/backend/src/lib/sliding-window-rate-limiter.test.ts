import Redis from 'ioredis';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { env } from '../config/env';
import { SlidingWindowRateLimiter } from './sliding-window-rate-limiter';

describe('SlidingWindowRateLimiter', () => {
  const redis = new Redis(env.REDIS_URL);
  const limiter = new SlidingWindowRateLimiter(redis);

  beforeAll(async () => {
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.quit();
  });

  it('blocks after the configured number of attempts', async () => {
    const key = 'test:rate-limit';

    expect(await limiter.tooManyAttempts(key, 2, 60)).toBe(false);
    await limiter.hit(key, 60);
    expect(await limiter.tooManyAttempts(key, 2, 60)).toBe(false);
    await limiter.hit(key, 60);
    expect(await limiter.tooManyAttempts(key, 2, 60)).toBe(true);
  });
});
