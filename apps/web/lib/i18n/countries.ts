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

export function getCountryName(
  countryCode: string,
  locale: Locale,
): string {
  ensureCountryLocalesRegistered();
  return (
    countries.getName(countryCode, locale, { select: "official" }) ??
    countryCode
  );
}

export function getCountryOptions(locale: Locale) {
  ensureCountryLocalesRegistered();
  const names = countries.getNames(locale, { select: "official" });

  return Object.entries(names)
    .map(([code, name]) => ({ code, name }))
    .sort((left, right) => left.name.localeCompare(right.name, locale));
}
