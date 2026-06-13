import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
import deLocale from "i18n-iso-countries/langs/de.json";

import type { Locale } from "@/lib/i18n/config";

let registered = false;

function ensureCountryLocalesRegistered() {
  if (registered) return;
  countries.registerLocale(enLocale);
  countries.registerLocale(deLocale);
  registered = true;
}

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

export function getCountryName(
  countryCode: string,
  locale: Locale,
): string {
  ensureCountryLocalesRegistered();
  const alpha2 = normalizeCountryCode(countryCode)?.toUpperCase() ?? countryCode;

  return (
    countries.getName(alpha2, locale, { select: "official" }) ??
    countryCode
  );
}

export function getCountryOptions(locale: Locale) {
  ensureCountryLocalesRegistered();
  const names = countries.getNames(locale, { select: "official" });

  return Object.entries(names)
    .map(([code, name]) => ({
      code: code.toLowerCase(),
      name,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, locale));
}

export const ORGANIZATION_COUNTRY_DEFAULT = "at";
