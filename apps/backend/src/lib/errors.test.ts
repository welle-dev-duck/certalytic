import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { AppError, NotFoundError, ValidationError } from './errors';

describe('AppError', () => {
  it('stores status code and error code', () => {
    const error = new AppError('Something failed', 418, 'TEAPOT');

    expect(error.message).toBe('Something failed');
    expect(error.statusCode).toBe(418);
    expect(error.code).toBe('TEAPOT');
    expect(error.name).toBe('AppError');
  });
});

describe('NotFoundError', () => {
  it('defaults to a 404 not found response', () => {
    const error = new NotFoundError();

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Not found');
  });
});

describe('ValidationError', () => {
  it('wraps zod issues', () => {
    const schema = z.object({ email: z.email() });
    const result = schema.safeParse({ email: 'invalid' });

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    const error = new ValidationError(result.error);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.issues.issues.length).toBeGreaterThan(0);
  });
});
