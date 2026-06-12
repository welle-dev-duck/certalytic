import { describe, expect, it } from 'vitest';

import { computeDebitedTokens } from './billing-tokens';

describe('computeDebitedTokens', () => {
  it('consumes plan tokens before refill tokens', () => {
    expect(computeDebitedTokens({ planTokens: 2, refillTokens: 5 }, 3)).toEqual({
      planTokens: 0,
      refillTokens: 4,
    });
  });

  it('returns null when the balance is insufficient', () => {
    expect(computeDebitedTokens({ planTokens: 1, refillTokens: 0 }, 2)).toBeNull();
  });

  it('allows debiting exactly the combined balance', () => {
    expect(computeDebitedTokens({ planTokens: 1, refillTokens: 2 }, 3)).toEqual({
      planTokens: 0,
      refillTokens: 0,
    });
  });
});
