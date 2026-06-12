import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization } from './auth.schema';

export const billing = pgTable(
  'billing',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' })
      .unique(),
    planTokens: integer('plan_tokens').notNull().default(0),
    refillTokens: integer('refill_tokens').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('billing_organizationId_idx').on(table.organizationId)],
);

export const billingPackPurchases = pgTable(
  'billing_pack_purchases',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    stripeCheckoutSessionId: text('stripe_checkout_session_id').notNull().unique(),
    packKey: text('pack_key').notNull(),
    tokens: integer('tokens').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('billing_pack_purchases_organizationId_idx').on(table.organizationId),
  ],
);

export const billingRelations = relations(billing, ({ one }) => ({
  organization: one(organization, {
    fields: [billing.organizationId],
    references: [organization.id],
  }),
}));

export const billingPackPurchasesRelations = relations(
  billingPackPurchases,
  ({ one }) => ({
    organization: one(organization, {
      fields: [billingPackPurchases.organizationId],
      references: [organization.id],
    }),
  }),
);
