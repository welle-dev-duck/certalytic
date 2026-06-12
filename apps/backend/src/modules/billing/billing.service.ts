import { and, eq } from 'drizzle-orm';
import Stripe from 'stripe';

import { env, plans, tokenPacks } from '../../config/env';
import type { Database } from '../../db/index';
import { member, organization } from '../../db/schema/auth.schema';
import {
  billing,
  billingPackPurchases,
} from '../../db/schema/billing.schema';
import { AppError } from '../../lib/errors';
import { generateId } from '../../lib/id';
import type { BillingUsageDto } from './billing.dto';
import type { PlanFeaturesService, PlanId } from './plans';

const PACK_KEY_MAP = {
  quick_refill: 'quickRefill',
  pipeline_surge: 'pipelineSurge',
  high_volume_boost: 'highVolumeBoost',
} as const;

type PackKey = keyof typeof PACK_KEY_MAP;

export class BillingService {
  private stripeClient: Stripe | undefined;

  constructor(
    private readonly db: Database,
    private readonly planFeatures?: PlanFeaturesService,
  ) {}

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

  async ensureBilling(organizationId: string): Promise<typeof billing.$inferSelect> {
    const existing = await this.db.query.billing.findFirst({
      where: eq(billing.organizationId, organizationId),
    });

    if (existing) {
      return existing;
    }

    const planId: PlanId = this.planFeatures
      ? await this.planFeatures.resolvePlan(organizationId)
      : 'free';
    const planTokens = plans[planId].tokens ?? 3;
    const id = generateId();

    await this.db.insert(billing).values({
      id,
      organizationId,
      planTokens,
      refillTokens: 0,
    });

    const created = await this.db.query.billing.findFirst({
      where: eq(billing.id, id),
    });

    if (!created) {
      throw new Error('Failed to create billing row.');
    }

    return created;
  }

  async usageSummary(organizationId: string): Promise<BillingUsageDto> {
    if (!this.planFeatures) {
      throw new Error('PlanFeaturesService is required for usage summary.');
    }

    const planId = await this.planFeatures.resolvePlan(organizationId);
    const plan = plans[planId];
    const balance = await this.ensureBilling(organizationId);

    return {
      plan: planId,
      planLabel: plan.name,
      planQuota: plan.tokens,
      planTokens: balance.planTokens,
      refillTokens: balance.refillTokens,
      available: balance.planTokens + balance.refillTokens,
      canPurchasePacks: plan.tokenPacks,
    };
  }

  async availableScreeningTokens(organizationId: string): Promise<number> {
    const balance = await this.ensureBilling(organizationId);

    return balance.planTokens + balance.refillTokens;
  }

  async canConsumeScreening(
    organizationId: string,
    amount = 1,
  ): Promise<boolean> {
    return (await this.availableScreeningTokens(organizationId)) >= amount;
  }

  async debitScreening(organizationId: string, amount = 1): Promise<void> {
    if (!(await this.canConsumeScreening(organizationId, amount))) {
      throw new AppError(
        'Insufficient screening tokens.',
        402,
        'INSUFFICIENT_TOKENS',
      );
    }

    const balance = await this.ensureBilling(organizationId);
    let remaining = amount;
    let planTokens = balance.planTokens;
    let refillTokens = balance.refillTokens;

    if (planTokens > 0 && remaining > 0) {
      const fromPlan = Math.min(planTokens, remaining);
      planTokens -= fromPlan;
      remaining -= fromPlan;
    }

    if (refillTokens > 0 && remaining > 0) {
      const fromRefill = Math.min(refillTokens, remaining);
      refillTokens -= fromRefill;
      remaining -= fromRefill;
    }

    if (remaining > 0) {
      throw new AppError(
        'Insufficient screening tokens.',
        402,
        'INSUFFICIENT_TOKENS',
      );
    }

    await this.db
      .update(billing)
      .set({ planTokens, refillTokens })
      .where(eq(billing.organizationId, organizationId));
  }

  async resetPlanTokens(organizationId: string): Promise<void> {
    if (!this.planFeatures) {
      return;
    }

    const planId = await this.planFeatures.resolvePlan(organizationId);
    const planTokens = plans[planId].tokens ?? 3;

    await this.ensureBilling(organizationId);
    await this.db
      .update(billing)
      .set({ planTokens })
      .where(eq(billing.organizationId, organizationId));
  }

  async creditRefillPack(
    organizationId: string,
    packKey: PackKey,
    stripeCheckoutSessionId: string,
  ): Promise<void> {
    const existing = await this.db.query.billingPackPurchases.findFirst({
      where: eq(
        billingPackPurchases.stripeCheckoutSessionId,
        stripeCheckoutSessionId,
      ),
    });

    if (existing) {
      return;
    }

    const configKey = PACK_KEY_MAP[packKey];
    const pack = tokenPacks[configKey];

    await this.ensureBilling(organizationId);

    await this.db.insert(billingPackPurchases).values({
      id: generateId(),
      organizationId,
      stripeCheckoutSessionId,
      packKey,
      tokens: pack.tokens,
    });

    const balance = await this.ensureBilling(organizationId);

    await this.db
      .update(billing)
      .set({ refillTokens: balance.refillTokens + pack.tokens })
      .where(eq(billing.organizationId, organizationId));
  }

  async createPackCheckoutSession(
    organizationId: string,
    packKey: PackKey,
  ): Promise<string> {
    if (!this.planFeatures) {
      throw new Error('PlanFeaturesService is required for pack checkout.');
    }

    const canPurchase = await this.planFeatures.can(
      organizationId,
      'token_packs',
    );

    if (!canPurchase) {
      throw new AppError(
        'Token packs require a paid plan.',
        403,
        'PLAN_FEATURE_REQUIRED',
      );
    }

    const configKey = PACK_KEY_MAP[packKey];
    const pack = tokenPacks[configKey];
    const priceId = pack.stripePrice;

    if (!priceId) {
      throw new AppError('Invalid token pack selected.', 400, 'VALIDATION_ERROR');
    }

    const org = await this.db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { stripeCustomerId: true },
    });

    if (!org?.stripeCustomerId) {
      throw new AppError(
        'Set up billing before purchasing token packs.',
        400,
        'BILLING_NOT_READY',
      );
    }

    const session = await this.getStripeClient().checkout.sessions.create({
      mode: 'payment',
      customer: org.stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.WEB_APP_URL}/billing?pack=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.WEB_APP_URL}/billing?pack=cancelled`,
      metadata: {
        organization_id: organizationId,
        pack: packKey,
      },
    });

    if (!session.url) {
      throw new Error('Stripe checkout session did not return a URL.');
    }

    return session.url;
  }

  async confirmPackCheckoutSession(
    organizationId: string,
    sessionId: string,
  ): Promise<void> {
    const session = await this.getStripeClient().checkout.sessions.retrieve(
      sessionId,
    );

    if (session.mode !== 'payment') {
      return;
    }

    const metadata = session.metadata ?? {};
    const packKey = metadata.pack as PackKey | undefined;
    const metadataOrganizationId = metadata.organization_id;

    if (
      metadataOrganizationId !== organizationId ||
      !packKey ||
      !(packKey in PACK_KEY_MAP)
    ) {
      throw new AppError('Checkout session is invalid.', 400, 'VALIDATION_ERROR');
    }

    await this.creditRefillPack(organizationId, packKey, session.id);
  }

  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        return;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice,
        );
        return;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        return;
      default:
        return;
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    if (session.mode !== 'payment') {
      return;
    }

    const metadata = session.metadata ?? {};
    const organizationId = metadata.organization_id;
    const packKey = metadata.pack as PackKey | undefined;

    if (
      !organizationId ||
      !packKey ||
      !(packKey in PACK_KEY_MAP) ||
      !session.id
    ) {
      return;
    }

    await this.creditRefillPack(organizationId, packKey, session.id);
  }

  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice,
  ): Promise<void> {
    const billingReason = invoice.billing_reason;

    if (
      billingReason !== 'subscription_create' &&
      billingReason !== 'subscription_cycle' &&
      billingReason !== 'subscription_update'
    ) {
      return;
    }

    const customerId =
      typeof invoice.customer === 'string'
        ? invoice.customer
        : invoice.customer?.id;

    if (!customerId) {
      return;
    }

    const org = await this.findOrganizationByStripeCustomerId(customerId);

    if (!org) {
      return;
    }

    await this.resetPlanTokens(org.id);
  }

  private async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id;

    if (!customerId) {
      return;
    }

    const org = await this.findOrganizationByStripeCustomerId(customerId);

    if (!org) {
      return;
    }

    await this.ensureBilling(org.id);
    await this.db
      .update(billing)
      .set({
        planTokens: plans.free.tokens ?? 3,
        refillTokens: 0,
      })
      .where(eq(billing.organizationId, org.id));
  }

  private async findOrganizationByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<{ id: string } | undefined> {
    const org = await this.db.query.organization.findFirst({
      where: eq(organization.stripeCustomerId, stripeCustomerId),
      columns: { id: true },
    });

    return org ?? undefined;
  }
}

export function buildStripeSubscriptionPlans(): Array<{
  name: string;
  priceId: string;
}> {
  return (['starter', 'growth', 'scale'] as const).flatMap((planId) => {
    const plan = plans[planId];
    const priceId = plan.stripePrice;

    if (!priceId) {
      return [];
    }

    return [{ name: planId, priceId }];
  });
}
