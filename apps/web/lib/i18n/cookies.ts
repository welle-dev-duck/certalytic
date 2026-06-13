import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  LOCALE_COOKIE,
  localeCookieOptions,
  type Locale,
} from "@/lib/i18n/config";

export async function readLocaleCookie(): Promise<Locale | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : null;
}

export async function getLocale(): Promise<Locale> {
  return (await readLocaleCookie()) ?? defaultLocale;
}

export function writeLocaleCookie(locale: Locale): string {
  const { path, maxAge, sameSite } = localeCookieOptions();
  return `${LOCALE_COOKIE}=${locale}; Path=${path}; Max-Age=${maxAge}; SameSite=${sameSite}`;
}
