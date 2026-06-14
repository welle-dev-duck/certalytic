"use client";

import { ArrowRight } from "lucide-react";
import Link from "@/components/ui/link";

import { MarketingFeaturesBento } from "@/components/marketing/marketing-features-bento";
import { MarketingScreeningPreview } from "@/components/marketing/marketing-screening-preview";
import { Button } from "@/components/ui/button";
import {
  EnterprisePlanCard,
  PAID_SUBSCRIPTION_PLANS,
  SubscriptionPlanCard,
} from "@/features/billing/components/plan-cards";
import { CONTACT_EMAIL } from "@/features/billing/plans";
import { captureMarketingCta } from "@/lib/analytics";
import { EuPrivacySection } from "@/features/marketing/eu-privacy-section";
import { WelcomeHero } from "@/features/marketing/welcome-hero";
import { useTranslations } from "@/lib/i18n/client";
import { FREE_PLAN_TOKENS } from "@/lib/marketing-data";
import { routes } from "@/lib/routes";

export { WelcomeHero, EuPrivacySection };

export function ProductSection() {
  const t = useTranslations("marketing");

  return (
    <section
      id="features"
      className="border-b border-border bg-card/40 py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            {t("sections.product.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("sections.product.description")}
          </p>
        </div>
        <MarketingFeaturesBento />
      </div>
    </section>
  );
}

export function DemoSection() {
  const t = useTranslations("marketing");

  return (
    <section id="demo" className="py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            {t("sections.demo.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("sections.demo.description")}
          </p>
        </div>
        <MarketingScreeningPreview />
      </div>
    </section>
  );
}

export function PricingSection() {
  const t = useTranslations("marketing");

  return (
    <section id="pricing" className="border-y border-border py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            {t("sections.pricing.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("sections.pricing.description")}
          </p>
        </div>

        <div className="mb-8 rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
          <p className="text-sm leading-relaxed text-foreground">
            {t("sections.pricing.freePlanBanner", { tokens: FREE_PLAN_TOKENS })}{" "}
            <Link
              href={routes.signUp()}
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={() =>
                captureMarketingCta(
                  "pricing.free_plan",
                  t("sections.pricing.freePlanLink"),
                )
              }
            >
              {t("sections.pricing.freePlanLink")}
            </Link>
            .
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAID_SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionPlanCard
              key={plan.value}
              plan={plan}
              highlighted={plan.value === "growth"}
              footer={
                <Button className="w-full" variant="outline" asChild>
                  <Link
                    href={routes.signUp()}
                    onClick={() =>
                      captureMarketingCta(
                        `pricing.plan.${plan.value}`,
                        t("sections.pricing.getStarted"),
                      )
                    }
                  >
                    {t("sections.pricing.getStarted")}
                  </Link>
                </Button>
              }
            />
          ))}

          <EnterprisePlanCard
            footer={
              <Button className="w-full" variant="outline" asChild>
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Certalytic%20General%20Inquiry`}
                  onClick={() =>
                    captureMarketingCta(
                      "pricing.enterprise",
                      t("sections.pricing.contactSales"),
                    )
                  }
                >
                  {t("sections.pricing.contactSales")}
                </a>
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}

export function AudienceSection() {
  const t = useTranslations("marketing");

  return (
    <section className="border-y border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              {t("sections.audience.title")}
            </h2>
            <ul className="mt-8 space-y-4 text-sm leading-relaxed text-muted-foreground">
              <li>{t("sections.audience.cto")}</li>
              <li>{t("sections.audience.agency")}</li>
              <li>{t("sections.audience.talentHead")}</li>
            </ul>
          </div>
          <div className="border border-border bg-card p-8">
            <h3 className="text-lg font-semibold">
              {t("sections.audience.cardTitle")}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("sections.audience.cardP1")}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {t("sections.audience.cardP2")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaSection() {
  const t = useTranslations("marketing");

  return (
    <section className="bg-primary py-16 text-primary-foreground/80">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <div>
          <p className="max-w-lg text-2xl font-semibold text-primary-foreground">
            {t("sections.cta.title")}
          </p>
          <p className="mt-2 max-w-lg text-sm text-primary-foreground/80">
            {t("sections.cta.description")}
          </p>
        </div>
        <Button size="lg" variant="secondary" className="text-foreground" asChild>
          <Link
            href={routes.signUp()}
            onClick={() =>
              captureMarketingCta("cta.bottom", t("sections.cta.button"))
            }
          >
            {t("sections.cta.button")}
            <ArrowRight size={16} />
          </Link>
        </Button>
      </div>
    </section>
  );
}
