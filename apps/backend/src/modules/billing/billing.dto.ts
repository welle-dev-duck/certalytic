import { z } from 'zod';

import { PLAN_IDS } from './plans';

export const billingUsageSchema = z.object({
  plan: z.enum(PLAN_IDS),
  planLabel: z.string(),
  planQuota: z.number().int().nonnegative().nullable(),
  planTokens: z.number().int().nonnegative(),
  refillTokens: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  canPurchasePacks: z.boolean(),
});

export type BillingUsageDto = z.infer<typeof billingUsageSchema>;

export const packCheckoutBodySchema = z.object({
  pack: z.enum(['quick_refill', 'pipeline_surge', 'high_volume_boost']),
});

export type PackCheckoutBodyDto = z.infer<typeof packCheckoutBodySchema>;

export const packCheckoutResponseSchema = z.object({
  url: z.string().url(),
});

export const packConfirmBodySchema = z.object({
  session_id: z.string().min(1),
});
