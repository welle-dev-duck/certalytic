"use client";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ImpersonationBanner } from "@/components/impersonation-banner";

export function GlobalChrome() {
  return (
    <>
      <ImpersonationBanner />
      <CookieConsentBanner />
    </>
  );
}
