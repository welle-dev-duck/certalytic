import { describe, expect, it, vi } from 'vitest';

import { AppError } from '../lib/errors';
import type { AuthService } from '../modules/auth/auth.service';
import type { OrganizationsService } from '../modules/organizations/organizations.service';
import {
  createMockNext,
  createMockRequest,
  createMockResponse,
} from '../test/helpers/express';
import { createRequireOrganization } from './require-organization';

function createOrganizationsService(
  organization?: {
    id: string;
    name: string;
    slug: string;
    role: 'owner' | 'admin' | 'member';
  },
): OrganizationsService {
  return {
    resolveActiveContext: vi.fn().mockResolvedValue(organization),
  } as unknown as OrganizationsService;
}

function createAuthService(
  defaultOrganizationId?: string,
): AuthService {
  return {
    getDefaultOrganization: vi
      .fn()
      .mockResolvedValue(defaultOrganizationId),
    setSessionActiveOrganization: vi.fn().mockResolvedValue(undefined),
  } as unknown as AuthService;
}

describe('createRequireOrganization', () => {
  it('attaches organization context for active members', async () => {
    const organization = {
      id: '01932f5a-7b2a-7000-8000-000000000010',
      name: 'Acme',
      slug: 'acme',
      role: 'owner' as const,
    };
    const organizationsService = createOrganizationsService(organization);
    const authService = createAuthService();
    const middleware = createRequireOrganization(
      organizationsService,
      authService,
    );
    const req = createMockRequest({
      session: {
        session: {
          id: 'session-id',
          activeOrganizationId: organization.id,
        },
        user: { id: 'user-id' },
      } as never,
    });
    const next = createMockNext();

    await middleware(req, createMockResponse(), next);

    expect(req.organization).toEqual(organization);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects users without any organization membership', async () => {
    const middleware = createRequireOrganization(
      createOrganizationsService(),
      createAuthService(),
    );
    const req = createMockRequest({
      session: {
        session: { id: 'session-id', activeOrganizationId: null },
        user: { id: 'user-id' },
      } as never,
    });
    const next = createMockNext();

    await middleware(req, createMockResponse(), next);

    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('No active organization', 403, 'NO_ACTIVE_ORGANIZATION'),
    );
  });

  it('heals missing active organization from the default membership', async () => {
    const organization = {
      id: '01932f5a-7b2a-7000-8000-000000000010',
      name: 'Acme',
      slug: 'acme',
      role: 'owner' as const,
    };
    const organizationsService = createOrganizationsService(organization);
    const authService = createAuthService(organization.id);
    const middleware = createRequireOrganization(
      organizationsService,
      authService,
    );
    const req = createMockRequest({
      session: {
        session: { id: 'session-id', activeOrganizationId: null },
        user: { id: 'user-id' },
      } as never,
    });
    const next = createMockNext();

    await middleware(req, createMockResponse(), next);

    expect(authService.setSessionActiveOrganization).toHaveBeenCalledWith(
      'session-id',
      organization.id,
    );
    expect(req.organization).toEqual(organization);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects users who are not members of the active organization', async () => {
    const middleware = createRequireOrganization(
      createOrganizationsService(),
      createAuthService(),
    );
    const req = createMockRequest({
      session: {
        session: {
          id: 'session-id',
          activeOrganizationId: '01932f5a-7b2a-7000-8000-000000000010',
        },
        user: { id: 'user-id' },
      } as never,
    });
    const next = createMockNext();

    await middleware(req, createMockResponse(), next);

    expect(next.mock.calls[0]?.[0]).toEqual(
      new AppError('Forbidden', 403, 'FORBIDDEN'),
    );
  });
});
