export const COOKIE_CONSENT_NAME = "certalytic_cookie_consent";
export const COOKIE_CONSENT_ALL = "all";
export const COOKIE_CONSENT_ESSENTIALS = "essentials";

const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type CookieConsentChoice =
  | typeof COOKIE_CONSENT_ALL
  | typeof COOKIE_CONSENT_ESSENTIALS;

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  if (!match) return null;
  return decodeURIComponent(match.slice(name.length + 1));
}

export function hasCookieConsent(): boolean {
  const value = readCookie(COOKIE_CONSENT_NAME);
  return (
    value === COOKIE_CONSENT_ALL ||
    value === COOKIE_CONSENT_ESSENTIALS ||
    value === "accepted"
  );
}

export function acceptCookieConsent(choice: CookieConsentChoice): void {
  document.cookie = `${COOKIE_CONSENT_NAME}=${choice}; Path=/; Max-Age=${CONSENT_MAX_AGE_SECONDS}; SameSite=Lax`;
}
