export const LOCALE_COOKIE = "certalytic-locale";

export const locales = ["en", "de"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const LOCALE_NATIVE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "en" || value === "de";
}

export function resolveLocaleFromHeader(
  acceptLanguage: string | null | undefined,
): Locale {
  if (!acceptLanguage) return defaultLocale;

  const tokens = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase())
    .filter((token): token is string => Boolean(token));

  for (const token of tokens) {
    if (token === "de" || token.startsWith("de-")) return "de";
    if (token === "en" || token.startsWith("en-")) return "en";
  }

  return defaultLocale;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function localeCookieOptions() {
  return {
    path: "/",
    maxAge: ONE_YEAR_SECONDS,
    sameSite: "lax" as const,
  };
}
