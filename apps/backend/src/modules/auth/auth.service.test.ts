import { describe, expect, it } from 'vitest';

import { createMockDb } from '../../test/helpers/mocks';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('returns the most recent organization membership', async () => {
    const db = createMockDb({
      member: { organizationId: '01932f5a-7b2a-7000-8000-000000000002' },
    });
    const service = new AuthService(db);

    await expect(
      service.getDefaultOrganization('01932f5a-7b2a-7000-8000-000000000001'),
    ).resolves.toBe('01932f5a-7b2a-7000-8000-000000000002');
  });

  it('returns undefined when the user has no memberships', async () => {
    const service = new AuthService(createMockDb());

    await expect(
      service.getDefaultOrganization('01932f5a-7b2a-7000-8000-000000000001'),
    ).resolves.toBeUndefined();
  });
});
