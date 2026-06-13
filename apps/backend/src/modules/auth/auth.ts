import { betterAuth, APIError } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin as adminPlugin } from 'better-auth/plugins/admin';
import { eq } from 'drizzle-orm';

import { env } from '../../config/env';
import { db } from '../../db/index';
import type { Database } from '../../db/index';
import { member } from '../../db/schema/auth.schema';
import { generateId } from '../../lib/id';
import { resolveOrganizationSlug } from '../../lib/organization-slug';
import {
  BillingService,
  buildStripeSubscriptionPlans,
} from '../billing/billing.service';
import type { CandidateSensitiveDataService } from '../candidates/candidate-sensitive-data.service';
import type { EmailsProducer } from '../emails/emails.producer';
import type { AuthService } from './auth.service';
import { organizationSchemaConfig } from './organization-fields';
import { organization } from 'better-auth/plugins/organization';
import { stripe } from '@better-auth/stripe';
import Stripe from 'stripe';

/** Used by the Better Auth CLI (`auth:generate`) to derive the Drizzle schema. */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  experimental: { joins: true },
  advanced: {
    database: {
      generateId,
    },
  },
  plugins: [
    adminPlugin(),
    organization({
      schema: organizationSchemaConfig,
    }),
    stripe({
      stripeClient: new Stripe(env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-05-27.dahlia',
      }),
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      organization: { enabled: true },
      subscription: { enabled: true, plans: [] },
    }),
  ],
});

export class Auth {
  readonly instance;

  constructor(
    private readonly db: Database,
    private readonly authService: AuthService,
    private readonly billingService: BillingService,
    private readonly emailsProducer: EmailsProducer,
    private readonly candidateSensitiveDataService: CandidateSensitiveDataService,
  ) {
    this.instance = betterAuth({
      baseURL: env.BASE_URL,
      appName: 'Certalytic',
      trustedOrigins: [env.BASE_URL, env.WEB_APP_URL],
      advanced: {
        cookiePrefix: 'certalytic',
        database: {
          generateId,
        },
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        minPasswordLength: 8,
        sendResetPassword: async ({ user, url }) => {
          await this.emailsProducer.enqueueResetPassword({ user, url });
        },
      },
      emailVerification: {
        autoSignInAfterVerification: true,
        sendOnSignUp: true,
        sendVerificationEmail: async ({ user, url }) => {
          await this.emailsProducer.enqueueVerification({ user, url });
        },
      },
      session: {
        cookieCache: {
          enabled: true,
          maxAge: 60,
        },
      },
      plugins: [
        adminPlugin(),
        organization({
          membershipLimit: 5,
          cancelPendingInvitationsOnReInvite: true,
          organizationHooks: {
            beforeCreateOrganization: async ({ organization: orgData }) => {
              if (typeof orgData.name !== 'string') return;

              const slug = await resolveOrganizationSlug(this.db, orgData.name);

              return {
                data: {
                  ...orgData,
                  slug,
                },
              };
            },
            beforeUpdateOrganization: async ({ organization: orgData, member }) => {
              if (typeof orgData.name !== 'string') return;

              const slug = await resolveOrganizationSlug(
                this.db,
                orgData.name,
                member.organizationId,
              );

              return {
                data: {
                  ...orgData,
                  slug,
                },
              };
            },
            beforeDeleteOrganization: async ({ organization: orgData }) => {
              await this.candidateSensitiveDataService.wipeOrganizationStorage(
                orgData.id,
              );
            },
          },
          sendInvitationEmail: async ({
            email,
            organization: org,
            inviter,
            invitation,
          }) => {
            const inviteLink = `${env.WEB_APP_URL}/invitation?id=${invitation.id}`;

            await this.emailsProducer.enqueueInvitation({
              email,
              organization: org,
              inviter,
              invitation,
              inviteLink,
            });
          },
          invitationExpiresIn: 48 * 3600,
          schema: organizationSchemaConfig,
        }),
        stripe({
          stripeClient: this.billingService.getStripeClient(),
          stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
          organization: { enabled: true },
          onEvent: async (event) => {
            await this.billingService.handleStripeEvent(event);
          },
          subscription: {
            authorizeReference: async ({ user, referenceId }) =>
              this.billingService.canManageStripeSubscription(
                referenceId,
                user.id,
              ),
            enabled: true,
            plans: buildStripeSubscriptionPlans(),
            onSubscriptionComplete: async ({ subscription }) => {
              await this.billingService.resetPlanTokens(subscription.referenceId);
            },
          },
        }),
      ],
      databaseHooks: {
        user: {
          delete: {
            before: async (user) => {
              const ownership = await this.db.query.member.findFirst({
                where: eq(member.userId, user.id),
                columns: { id: true, role: true },
              });

              if (ownership?.role === 'owner') {
                throw new APIError('BAD_REQUEST', {
                  message:
                    'Transfer or delete your organizations before deleting your account.',
                });
              }
            },
          },
        },
        session: {
          create: {
            before: async (userSession) => {
              const organizationId =
                await this.authService.getDefaultOrganization(
                  userSession.userId,
                );

              return {
                data: {
                  ...userSession,
                  activeOrganizationId: organizationId,
                },
              };
            },
          },
        },
      },
      experimental: {
        joins: true,
      },
      database: drizzleAdapter(this.db, {
        provider: 'pg',
      }),
    });
  }
}
