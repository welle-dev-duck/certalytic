import { Check } from "lucide-react";
import type { ReactNode } from "react";

import { ENTERPRISE_PLAN, SUBSCRIPTION_PLANS } from "@/features/billing/plans";

type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

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
  const displayFeatures =
    plan.includesPlan !== null ? plan.incrementalFeatures : plan.features;

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
            {plan.label}
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
          <span className="text-sm font-normal text-muted-foreground">/mo</span>
        </p>
        {plan.recommendation ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {plan.recommendation}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {plan.includesPlan ? (
          <p className="text-xs font-semibold text-foreground">
            Everything in {plan.includesPlan}, plus:
          </p>
        ) : null}
        {displayFeatures.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <Check size={12} className="mt-0.5 shrink-0 text-[#10B981]" />
            <span className="text-xs text-foreground">{feature}</span>
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
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
      <div>
        <p className="text-sm font-bold text-foreground">
          {ENTERPRISE_PLAN.label}
        </p>
        <p className="mt-1 text-2xl font-bold text-foreground">Custom</p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {ENTERPRISE_PLAN.recommendation}
        </p>
      </div>
      <div className="space-y-1.5">
        {ENTERPRISE_PLAN.features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <Check size={12} className="mt-0.5 shrink-0 text-[#10B981]" />
            <span className="text-xs text-foreground">{feature}</span>
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
