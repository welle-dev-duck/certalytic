import type { SubscriptionPlanId } from "@/features/billing/plans";

export type BillingUsage = {
  plan: SubscriptionPlanId;
  planLabel: string;
  planQuota: number | null;
  planTokens: number;
  includedUsed: number;
  includedRemaining: number;
  refillTokens: number;
  available: number;
  canPurchasePacks: boolean;
};
