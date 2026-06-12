export type BillingUsage = {
  plan: string;
  planLabel: string;
  planQuota: number | null;
  planTokens: number;
  refillTokens: number;
  available: number;
  canPurchasePacks: boolean;
};
