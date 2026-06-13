import {
  LOCALE_NATIVE_LABELS,
  type Locale,
  locales,
} from "@/lib/i18n/config";

export type OrganizationLanguage = Locale;

export const ORGANIZATION_LANGUAGE_DEFAULT: OrganizationLanguage = "en";

export function isOrganizationLanguage(
  value: string | null | undefined,
): value is OrganizationLanguage {
  return value === "en" || value === "de";
}

export function resolveOrganizationLanguage(
  value: string | null | undefined,
): OrganizationLanguage {
  return isOrganizationLanguage(value) ? value : ORGANIZATION_LANGUAGE_DEFAULT;
}

export function getOrganizationLanguageOptions() {
  return locales.map((code) => ({
    code,
    label: LOCALE_NATIVE_LABELS[code],
  }));
}
