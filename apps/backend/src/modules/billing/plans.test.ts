import { describe, expect, it } from 'vitest';

import { resolvePlanFromStripePrice } from './plans';

describe('resolvePlanFromStripePrice', () => {
  it('returns free when no price id is provided', () => {
    expect(resolvePlanFromStripePrice(null)).toBe('free');
    expect(resolvePlanFromStripePrice(undefined)).toBe('free');
    expect(resolvePlanFromStripePrice('price_unknown')).toBe('free');
  });
});
