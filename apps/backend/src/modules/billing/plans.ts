import { and, desc, eq, inArray } from 'drizzle-orm';

import { plans } from '../../config/env';
import type { Database } from '../../db/index';
import { subscription } from '../../db/schema/auth.schema';

export const PLAN_IDS = [
  'free',
  'starter',
  'growth',
  'scale',
  'enterprise',
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type PlanFeature =
  | 'cross_source'
  | 'cross_source_manual'
  | 'full_breakdown'
  | 'token_packs'
  | 'priority_queue'
  | 'watermarked_exports'
  | 'saved_roles'
  | 'role_context_assets';

export function resolvePlanFromStripePrice(
  stripePriceId: string | null | undefined,
): PlanId {
  if (!stripePriceId) {
    return 'free';
  }

  for (const planId of PLAN_IDS) {
    const plan = plans[planId];

    if ('stripePrice' in plan && plan.stripePrice === stripePriceId) {
      return planId;
    }
  }

  return 'free';
}

export class PlanFeaturesService {
  constructor(private readonly db: Database) {}

  async resolvePlan(organizationId: string): Promise<PlanId> {
    const activeSubscription = await this.db.query.subscription.findFirst({
      where: and(
        eq(subscription.referenceId, organizationId),
        inArray(subscription.status, ['active', 'trialing', 'past_due']),
      ),
      orderBy: desc(subscription.periodStart),
      columns: { plan: true },
    });

    if (
      activeSubscription &&
      PLAN_IDS.includes(activeSubscription.plan as PlanId)
    ) {
      return activeSubscription.plan as PlanId;
    }

    return 'free';
  }

  async can(organizationId: string, feature: PlanFeature): Promise<boolean> {
    const planId = await this.resolvePlan(organizationId);
    const plan = plans[planId];

    switch (feature) {
      case 'cross_source':
        return plan.crossSource;
      case 'cross_source_manual':
        return plan.crossSourceManual;
      case 'full_breakdown':
        return plan.fullBreakdown;
      case 'token_packs':
        return plan.tokenPacks;
      case 'priority_queue':
        return plan.priorityQueue;
      case 'watermarked_exports':
        return plan.watermarkedExports;
      case 'saved_roles':
        return plan.savedRoles;
      case 'role_context_assets':
        return plan.roleContextAssets;
      default:
        return false;
    }
  }

  async maxRoleDocuments(organizationId: string): Promise<number> {
    const planId = await this.resolvePlan(organizationId);

    return plans[planId].maxRoleDocuments;
  }
}
