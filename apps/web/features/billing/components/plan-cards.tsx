"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { ENTERPRISE_PLAN, SUBSCRIPTION_PLANS } from "@/features/billing/plans";
import { useTranslations } from "@/lib/i18n/client";
import { getIntegrityColor } from "@/lib/integrity";

const successColor = getIntegrityColor("high");

type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

const PLAN_FEATURE_KEYS: Record<
  SubscriptionPlan["value"],
  readonly string[]
> = {
  free: ["screenings", "savedRoles", "watermarkedExports"],
  starter: [
    "screenings",
    "integrityBreakdown",
    "crossReference",
    "refillableTokens",
    "exports",
    "emailSupport",
  ],
  growth: ["screenings", "seats", "priorityEmail"],
  scale: ["screenings", "seats", "priorityQueue", "premiumSupport"],
};

const ENTERPRISE_FEATURE_KEYS = [
  "unlimited",
  "atsIntegrations",
  "sso",
  "dedicatedSupport",
  "onboarding",
  "apiAccess",
] as const;

type SubscriptionPlanCardProps = {
  plan: SubscriptionPlan;
  footer: ReactNode;
  highlighted?: boolean;
  badge?: string;
};

export function SubscriptionPlanCard({
  plan,
  footer,
  highlighted = false,
  badge,
}: SubscriptionPlanCardProps) {
  const t = useTranslations("app");
  const planKey = plan.value;
  const featureKeys = PLAN_FEATURE_KEYS[planKey];

  return (
    <div
      className={`flex flex-col gap-4 rounded-lg border p-5 ${
        highlighted
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card"
      }`}
    >
      <div>
        <div className="mb-1 flex items-center gap-2">
          <p
            className={`text-sm font-bold ${
              highlighted ? "text-primary" : "text-foreground"
            }`}
          >
            {t(`billing.plans.${planKey}.label`)}
          </p>
          {badge ? (
            <span
              className="rounded px-2 py-0.5 text-[10px] font-bold tracking-wide"
              style={{
                background:
                  "color-mix(in oklch, var(--primary) 15%, transparent)",
                color: "var(--c-cyan)",
                border:
                  "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <p className="text-2xl font-bold tabular-nums text-foreground">
          €{plan.price}
          <span className="text-sm font-normal text-muted-foreground">
            {t("billing.plans.perMonth")}
          </span>
        </p>
        {plan.recommendation ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {t(`billing.plans.${planKey}.recommendation`)}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {plan.includesPlan ? (
          <p className="text-xs font-semibold text-foreground">
            {t(`billing.plans.${planKey}.includesPrefix`, {
              plan: t(`billing.plans.${planKey}.includesPlan`),
            })}
          </p>
        ) : null}
        {featureKeys.map((featureKey) => (
          <div key={featureKey} className="flex items-start gap-2">
            <Check
              size={12}
              className="mt-0.5 shrink-0"
              style={{ color: successColor }}
            />
            <span className="text-xs text-foreground">
              {t(`billing.plans.${planKey}.features.${featureKey}`)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto">{footer}</div>
    </div>
  );
}

type EnterprisePlanCardProps = {
  footer: ReactNode;
};

export function EnterprisePlanCard({ footer }: EnterprisePlanCardProps) {
  const t = useTranslations("app");

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <p className="text-sm font-bold text-foreground">
          {t("billing.plans.enterprise.label")}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {t("billing.plans.enterprise.price")}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("billing.plans.enterprise.recommendation")}
        </p>
      </div>
      <div className="space-y-1.5">
        {ENTERPRISE_FEATURE_KEYS.map((featureKey) => (
          <div key={featureKey} className="flex items-start gap-2">
            <Check
              size={12}
              className="mt-0.5 shrink-0"
              style={{ color: successColor }}
            />
            <span className="text-xs text-foreground">
              {t(`billing.plans.enterprise.features.${featureKey}`)}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto">{footer}</div>
    </div>
  );
}

export const PAID_SUBSCRIPTION_PLANS = SUBSCRIPTION_PLANS.filter(
  (plan) => plan.value !== "free",
);
