import { describe, expect, it } from 'vitest';

import { AppError } from '../lib/errors';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test/helpers/express';
import {
  requireOrgAdmin,
  requireOrgOwner,
  requireOrgRoles,
} from './require-org-role';

describe('requireOrgRoles', () => {
  it('allows matching roles through', () => {
    const req = createMockRequest({
      organization: {
        id: 'org-id',
        name: 'Acme',
        slug: 'acme',
        role: 'admin',
      },
    });
    const next = createMockNext();

    requireOrgRoles('owner', 'admin')(req, createMockResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects users without organization context', () => {
    const next = createMockNext();

    requireOrgAdmin(createMockRequest(), createMockResponse(), next);

    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
    );
  });

  it('rejects members for admin-only routes', () => {
    const req = createMockRequest({
      organization: {
        id: 'org-id',
        name: 'Acme',
        slug: 'acme',
        role: 'member',
      },
    });
    const next = createMockNext();

    requireOrgAdmin(req, createMockResponse(), next);

    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
    );
  });

  it('rejects non-owners for owner-only routes', () => {
    const req = createMockRequest({
      organization: {
        id: 'org-id',
        name: 'Acme',
        slug: 'acme',
        role: 'admin',
      },
    });
    const next = createMockNext();

    requireOrgOwner(req, createMockResponse(), next);

    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
    );
  });
});
