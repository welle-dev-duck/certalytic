import { describe, expect, it } from 'vitest';

import { AppError } from '../lib/errors';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
  getJsonBody,
  getStatusCode,
} from '../test/helpers/express';
import { ADMIN_ROLE, requireAdmin } from './require-admin';

describe('requireAdmin', () => {
  it('allows admins through', () => {
    const req = createMockRequest({
      session: {
        session: { id: 'session-id' },
        user: { id: 'user-id', role: ADMIN_ROLE },
      } as never,
    });
    const next = createMockNext();

    requireAdmin(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects unauthenticated requests', () => {
    const next = createMockNext();

    requireAdmin(createMockRequest(), createMockResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
    );
  });

  it('rejects non-admin users', () => {
    const req = createMockRequest({
      session: {
        session: { id: 'session-id' },
        user: { id: 'user-id', role: 'user' },
      } as never,
    });
    const next = createMockNext();

    requireAdmin(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledOnce();
    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
    );
  });
});
