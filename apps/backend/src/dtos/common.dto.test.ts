import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './common.dto';

describe('healthResponseSchema', () => {
  it('accepts healthy responses', () => {
    expect(
      healthResponseSchema.parse({
        status: 'ok',
        checks: {
          database: { status: 'ok', latencyMs: 12 },
          redis: { status: 'ok', latencyMs: 3 },
        },
      }),
    ).toEqual({
      status: 'ok',
      checks: {
        database: { status: 'ok', latencyMs: 12 },
        redis: { status: 'ok', latencyMs: 3 },
      },
    });
  });

  it('accepts unhealthy responses with error details', () => {
    expect(
      healthResponseSchema.parse({
        status: 'error',
        checks: {
          database: {
            status: 'error',
            latencyMs: 42,
            message: 'connection refused',
          },
          redis: { status: 'ok', latencyMs: 2 },
        },
      }),
    ).toMatchObject({
      status: 'error',
      checks: {
        database: {
          status: 'error',
          message: 'connection refused',
        },
      },
    });
  });

  it('rejects incomplete responses', () => {
    expect(() => healthResponseSchema.parse({ status: 'ok' })).toThrow();
  });
});
