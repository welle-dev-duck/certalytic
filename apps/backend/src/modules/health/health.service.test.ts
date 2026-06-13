import { describe, expect, it, vi } from 'vitest';

import { HealthService } from './health.service';

describe('HealthService', () => {
  it('returns ok when database and redis are reachable', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    };
    const redis = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };

    const service = new HealthService(
      pool as never,
      redis as never,
    );

    const result = await service.check();

    expect(result).toEqual({
      status: 'ok',
      checks: {
        database: {
          status: 'ok',
          latencyMs: expect.any(Number),
        },
        redis: {
          status: 'ok',
          latencyMs: expect.any(Number),
        },
      },
    });
  });

  it('returns error when database is unreachable', async () => {
    const pool = {
      query: vi.fn().mockRejectedValue(new Error('connection refused')),
    };
    const redis = {
      ping: vi.fn().mockResolvedValue('PONG'),
    };

    const service = new HealthService(
      pool as never,
      redis as never,
    );

    const result = await service.check();

    expect(result.status).toBe('error');
    expect(result.checks.database.status).toBe('error');
    expect(result.checks.database.message).toBe('connection refused');
    expect(result.checks.redis.status).toBe('ok');
  });

  it('returns error when redis does not respond with PONG', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
    };
    const redis = {
      ping: vi.fn().mockResolvedValue('NOPE'),
    };

    const service = new HealthService(
      pool as never,
      redis as never,
    );

    const result = await service.check();

    expect(result.status).toBe('error');
    expect(result.checks.redis.status).toBe('error');
    expect(result.checks.redis.message).toContain('Unexpected Redis ping response');
  });
});
