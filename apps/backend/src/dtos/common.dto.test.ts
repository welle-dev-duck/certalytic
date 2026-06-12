import { describe, expect, it } from 'vitest';

import { healthResponseSchema } from './common.dto';

describe('healthResponseSchema', () => {
  it('accepts healthy responses', () => {
    expect(healthResponseSchema.parse({ status: 'ok' })).toEqual({
      status: 'ok',
    });
  });

  it('rejects invalid statuses', () => {
    expect(() => healthResponseSchema.parse({ status: 'degraded' })).toThrow();
  });
});
