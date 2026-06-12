import { describe, expect, it } from 'vitest';

import { AppError } from '../lib/errors';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test/helpers/express';
import { requireAuth } from './require-auth';

describe('requireAuth', () => {
  it('allows authenticated users through', () => {
    const req = createMockRequest({
      session: {
        session: { id: 'session-id' },
        user: { id: 'user-id' },
      } as never,
    });
    const next = createMockNext();

    requireAuth(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects unauthenticated requests', () => {
    const next = createMockNext();

    requireAuth(createMockRequest(), createMockResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
    );
  });
});
