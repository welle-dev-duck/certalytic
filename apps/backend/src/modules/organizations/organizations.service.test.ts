import { describe, expect, it, vi } from 'vitest';

import type { Database } from '../../db/index';
import { OrganizationsService } from './organizations.service';

function createDb(membership?: {
  role: string;
  organization: { id: string; name: string; slug: string };
}): Database {
  return {
    query: {
      member: {
        findFirst: vi.fn().mockResolvedValue(membership),
        findMany: vi.fn().mockResolvedValue([{ id: 'member-1' }]),
      },
    },
  } as unknown as Database;
}

describe('OrganizationsService', () => {
  it('resolves active organization context for members', async () => {
    const service = new OrganizationsService(
      createDb({
        role: 'owner',
        organization: {
          id: '01932f5a-7b2a-7000-8000-000000000010',
          name: 'Acme',
          slug: 'acme',
        },
      }),
    );

    await expect(
      service.resolveActiveContext(
        '01932f5a-7b2a-7000-8000-000000000001',
        '01932f5a-7b2a-7000-8000-000000000010',
      ),
    ).resolves.toEqual({
      id: '01932f5a-7b2a-7000-8000-000000000010',
      name: 'Acme',
      slug: 'acme',
      role: 'owner',
    });
  });

  it('returns undefined for unknown roles', async () => {
    const service = new OrganizationsService(
      createDb({
        role: 'billing',
        organization: {
          id: '01932f5a-7b2a-7000-8000-000000000010',
          name: 'Acme',
          slug: 'acme',
        },
      }),
    );

    await expect(
      service.resolveActiveContext(
        '01932f5a-7b2a-7000-8000-000000000001',
        '01932f5a-7b2a-7000-8000-000000000010',
      ),
    ).resolves.toBeUndefined();
  });

  it('counts organizations for a user', async () => {
    const service = new OrganizationsService(createDb());

    await expect(
      service.countUserOrganizations('01932f5a-7b2a-7000-8000-000000000001'),
    ).resolves.toBe(1);
  });
});
