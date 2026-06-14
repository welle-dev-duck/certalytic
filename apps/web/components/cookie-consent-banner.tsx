"use client";

import { useEffect, useState } from "react";

import Link from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import {
  acceptCookieConsent,
  COOKIE_CONSENT_ALL,
  COOKIE_CONSENT_ESSENTIALS,
  hasCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookies/consent";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

export function CookieConsentBanner() {
  const t = useTranslations("common");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!hasCookieConsent());
  }, []);

  if (!visible) return null;

  function handleAccept(choice: CookieConsentChoice) {
    acceptCookieConsent(choice);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm"
    >
      <div className="surface-panel w-full max-w-lg space-y-6 rounded-lg border border-border p-6 shadow-xl sm:p-8">
        <div className="space-y-2 text-sm text-muted-foreground">
          <h2
            id="cookie-consent-title"
            className="font-display text-xl font-semibold tracking-tight text-foreground"
          >
            {t("cookieConsent.title")}
          </h2>
          <p id="cookie-consent-description" className="leading-relaxed">
            {t("cookieConsent.description")}{" "}
            <Link
              href={routes.legal.cookies()}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {t("cookieConsent.learnMore")}
            </Link>
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="sm:min-w-40"
            onClick={() => handleAccept(COOKIE_CONSENT_ESSENTIALS)}
          >
            {t("cookieConsent.acceptEssentials")}
          </Button>
          <Button
            type="button"
            className="sm:min-w-40"
            onClick={() => handleAccept(COOKIE_CONSENT_ALL)}
          >
            {t("cookieConsent.acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
