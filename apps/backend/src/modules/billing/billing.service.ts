import { and, eq } from 'drizzle-orm';
import Stripe from 'stripe';

import { env } from '../../config/env';
import type { Database } from '../../db/index';
import { member } from '../../db/schema/auth.schema';

export class BillingService {
  private stripeClient: Stripe | undefined;

  constructor(private readonly db: Database) {}

  getStripeClient(): Stripe {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    if (!this.stripeClient) {
      this.stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-05-27.dahlia',
      });
    }

    return this.stripeClient;
  }

  async canManageStripeSubscription(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const memberItem = await this.db.query.member.findFirst({
      where: and(
        eq(member.organizationId, organizationId),
        eq(member.userId, userId),
      ),
    });

    return memberItem?.role === 'owner';
  }
}
