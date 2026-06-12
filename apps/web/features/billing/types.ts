export type BillingUsage = {
  plan: string;
  planLabel: string;
  planQuota: number | null;
  planTokens: number;
  includedUsed: number;
  includedRemaining: number;
  refillTokens: number;
  available: number;
  canPurchasePacks: boolean;
};
