import { describe, expect, it } from 'vitest';

import {
  isValidCountryCode,
  normalizeCountryCode,
  organizationCountryInputSchema,
} from './country-code';

describe('country-code', () => {
  it('normalizes valid codes to lowercase alpha-2', () => {
    expect(normalizeCountryCode('AT')).toBe('at');
    expect(normalizeCountryCode(' de ')).toBe('de');
    expect(normalizeCountryCode('USA')).toBe('us');
  });

  it('rejects invalid codes', () => {
    expect(normalizeCountryCode('XX')).toBeUndefined();
    expect(normalizeCountryCode('')).toBeUndefined();
    expect(isValidCountryCode('not-a-country')).toBe(false);
  });

  it('validates through the organization schema', () => {
    expect(organizationCountryInputSchema.parse('AT')).toBe('at');
    expect(() => organizationCountryInputSchema.parse('XX')).toThrow();
  });
});
