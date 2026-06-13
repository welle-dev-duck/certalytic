"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "@/components/ui/link";

import { DataPrivacyPanel } from "@/components/marketing/data-privacy-panel";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

const TRUST_POINT_KEYS = [
  "privacy.trustPoints.euBased",
  "privacy.trustPoints.euStorage",
  "privacy.trustPoints.decisionSupport",
  "privacy.trustPoints.euInfrastructure",
  "privacy.trustPoints.audioDeletion",
] as const;

export function EuPrivacySection() {
  const t = useTranslations("marketing");

  return (
    <section
      id="privacy"
      className="relative overflow-hidden border-y border-primary/20 bg-gradient-to-b from-primary/10 via-background to-background py-24 md:min-h-[72vh] md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_55%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck size={22} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">
                {t("privacy.eyebrow")}
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl leading-[1.08] tracking-tight md:text-5xl lg:text-6xl">
              {t("privacy.titlePrefix")}{" "}
              <span className="text-primary">{t("privacy.titleHighlight")}</span>
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {t("privacy.description")}
            </p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {TRUST_POINT_KEYS.map((key) => (
                <li
                  key={key}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {t(key)}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="default" size="sm" asChild>
                <Link href={routes.legal.privacy()}>
                  {t("privacy.privacyPolicy")}
                  <ArrowRight size={14} />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.legal.dpa()}>{t("privacy.dpa")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={routes.legal.imprint()}>{t("privacy.imprint")}</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <DataPrivacyPanel
              prominent
              className="border-primary/25 bg-card/90 shadow-sm"
            />
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "Hetzner", sub: "DE / FI" },
                { label: "Mistral", sub: "Paris" },
                { label: "Stripe", sub: "Billing only" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="border border-border bg-card/80 px-3 py-4"
                >
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-[10px] tracking-wide text-muted-foreground uppercase">
                    {item.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
