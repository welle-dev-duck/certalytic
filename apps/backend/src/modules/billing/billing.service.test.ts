import { describe, expect, it } from 'vitest';

import { createMockDb, createMockPlanFeatures } from '../../test/helpers/mocks';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  it('allows organization owners to manage subscriptions', async () => {
    const db = createMockDb({
      member: {
        organizationId: '01932f5a-7b2a-7000-8000-000000000002',
        userId: '01932f5a-7b2a-7000-8000-000000000001',
        role: 'owner',
      },
    });
    const service = new BillingService(db, createMockPlanFeatures());

    await expect(
      service.canManageStripeSubscription(
        '01932f5a-7b2a-7000-8000-000000000002',
        '01932f5a-7b2a-7000-8000-000000000001',
      ),
    ).resolves.toBe(true);
  });

  it('denies non-owner members', async () => {
    const db = createMockDb({
      member: {
        organizationId: '01932f5a-7b2a-7000-8000-000000000002',
        userId: '01932f5a-7b2a-7000-8000-000000000001',
        role: 'member',
      },
    });
    const service = new BillingService(db, createMockPlanFeatures());

    await expect(
      service.canManageStripeSubscription(
        '01932f5a-7b2a-7000-8000-000000000002',
        '01932f5a-7b2a-7000-8000-000000000001',
      ),
    ).resolves.toBe(false);
  });

  it('returns a cached stripe client', () => {
    const service = new BillingService(createMockDb(), createMockPlanFeatures());

    expect(service.getStripeClient()).toBe(service.getStripeClient());
  });
});
