import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError, ValidationError } from '../lib/errors';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getJsonBody,
  getStatusCode,
} from '../test/helpers/express';
import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  it('handles validation errors', () => {
    const res = createMockResponse();
    const schema = z.object({ email: z.email() });
    const result = schema.safeParse({ email: 'invalid' });

    if (result.success) {
      throw new Error('Expected validation to fail');
    }

    errorHandler(
      new ValidationError(result.error),
      createMockRequest(),
      res,
      createMockNext(),
    );

    expect(getStatusCode(res)).toBe(400);
    expect(getJsonBody(res)).toMatchObject({
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
      },
    });
  });

  it('handles app errors with custom status codes', () => {
    const res = createMockResponse();

    errorHandler(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
      createMockRequest(),
      res,
      createMockNext(),
    );

    expect(getStatusCode(res)).toBe(403);
    expect(getJsonBody(res)).toEqual({
      error: {
        message: 'Forbidden',
        code: 'FORBIDDEN',
      },
    });
  });

  it('handles unknown errors as 500', () => {
    const res = createMockResponse();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    errorHandler(
      new Error('boom'),
      createMockRequest(),
      res,
      createMockNext(),
    );

    expect(getStatusCode(res)).toBe(500);
    expect(getJsonBody(res)).toEqual({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });

    consoleError.mockRestore();
  });
});
