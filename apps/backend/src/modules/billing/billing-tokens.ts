export type TokenBalance = {
  planTokens: number;
  refillTokens: number;
};

export function computeDebitedTokens(
  balance: TokenBalance,
  amount: number,
): TokenBalance | null {
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
    return null;
  }

  return { planTokens, refillTokens };
}
