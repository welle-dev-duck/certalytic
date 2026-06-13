import countries from 'i18n-iso-countries';
import { z } from 'zod';

/** Normalize any valid ISO 3166-1 code to lowercase alpha-2, or `undefined`. */
export function normalizeCountryCode(code: string): string | undefined {
  const trimmed = code.trim();
  if (!trimmed || !countries.isValid(trimmed)) {
    return undefined;
  }

  const alpha2 = countries.toAlpha2(trimmed);
  if (!alpha2) {
    return undefined;
  }

  return alpha2.toLowerCase();
}

export function isValidCountryCode(code: string): boolean {
  return normalizeCountryCode(code) !== undefined;
}

/** Validates and stores lowercase ISO 3166-1 alpha-2 (e.g. `at`). */
export const organizationCountryInputSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeCountryCode(value);

    if (!normalized) {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid country code',
      });
      return z.NEVER;
    }

    return normalized;
  });

export const ORGANIZATION_COUNTRY_DEFAULT = 'at';
