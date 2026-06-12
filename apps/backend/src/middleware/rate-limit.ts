import type { NextFunction, Request, Response } from 'express';
import type Redis from 'ioredis';

import { rateLimits, type RateLimitName } from '../config/env';
import { AppError } from '../lib/errors';
import { SlidingWindowRateLimiter } from '../lib/sliding-window-rate-limiter';


function resolveKey(
  req: Request,
  by: 'ip' | 'user',
  limiter: string,
): string {
  if (by === 'user' && req.session?.user?.id) {
    return `${limiter}:user:${req.session.user.id}`;
  }

  return `${limiter}:ip:${req.ip ?? 'unknown'}`;
}

export function createRateLimit(
  redis: Redis,
  limiter: RateLimitName,
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const config = rateLimits[limiter];
  const rateLimiter = new SlidingWindowRateLimiter(redis);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = resolveKey(req, config.by, limiter);

    if (
      await rateLimiter.tooManyAttempts(
        key,
        config.maxAttempts,
        config.decaySeconds,
      )
    ) {
      const retryAfter = await rateLimiter.availableIn(key, config.decaySeconds);

      res.setHeader('Retry-After', String(retryAfter));
      next(
        new AppError(
          `Too many requests. Please try again in ${retryAfter} seconds.`,
          429,
          'RATE_LIMITED',
        ),
      );
      return;
    }

    await rateLimiter.hit(key, config.decaySeconds);
    next();
  };
}
