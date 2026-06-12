import { describe, expect, it } from 'vitest';

import {
  createMockRequest,
  createMockResponse,
  getJsonBody,
  getStatusCode,
} from '../test/helpers/express';
import { notFound } from './not-found';

describe('notFound', () => {
  it('returns a structured 404 response', () => {
    const res = createMockResponse();

    notFound(createMockRequest(), res);

    expect(getStatusCode(res)).toBe(404);
    expect(getJsonBody(res)).toEqual({
      error: {
        message: 'Not found',
        code: 'NOT_FOUND',
      },
    });
  });
});
