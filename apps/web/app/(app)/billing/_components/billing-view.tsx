"use client";

import { Check, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CONTACT_EMAIL,
  ENTERPRISE_PLAN,
  SUBSCRIPTION_PLANS,
  TOKEN_PACKS,
} from "@/features/billing/plans";
import {
  useBillingPortal,
  useBillingUsage,
  usePackCheckout,
  useSubscriptionUpgrade,
} from "@/features/billing/hooks/use-billing";

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
      {label}
    </p>
  );
}

export function BillingView() {
  const { data: usage } = useBillingUsage();
  const packCheckout = usePackCheckout();
  const subscriptionUpgrade = useSubscriptionUpgrade();
  const billingPortal = useBillingPortal();
  const [pending, setPending] = useState<string | null>(null);

  const planQuota = usage?.planQuota ?? 0;
  const planTokens = usage?.planTokens ?? 0;
  const tokenUsed = planQuota > 0 ? Math.max(0, planQuota - planTokens) : 0;
  const tokenPct =
    planQuota > 0 ? Math.round((tokenUsed / planQuota) * 100) : 0;
  const currentPlan = usage?.plan ?? "free";

  function buyPack(key: (typeof TOKEN_PACKS)[number]["key"]) {
    setPending(key);
    packCheckout.mutate(key, {
      onSettled: () => setPending(null),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Checkout failed.",
        );
      },
    });
  }

  function switchPlan(plan: "starter" | "growth" | "scale") {
    setPending(plan);
    subscriptionUpgrade.mutate(plan, {
      onSettled: () => setPending(null),
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Checkout failed.",
        );
      },
    });
  }

  function openPortal() {
    billingPortal.mutate(undefined, {
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Could not open portal.",
        );
      },
    });
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Billing</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Screening token usage, plans, and add-on packs
        </p>
      </div>

      <section>
        <SectionHeader label="TOKEN USAGE" />
        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-primary" />
              <p className="text-xs font-semibold text-foreground">
                Included tokens this period
              </p>
            </div>
            <p className="font-mono text-xs font-bold text-foreground">
              {tokenUsed}{" "}
              <span className="text-muted-foreground">/ {planQuota || "—"}</span>
            </p>
          </div>
          {planQuota > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, tokenPct)}%`,
                  background:
                    tokenPct > 85
                      ? "#EF4444"
                      : tokenPct > 65
                        ? "#F59E0B"
                        : "var(--primary)",
                }}
              />
            </div>
          )}
          <p className="text-[10px] text-muted-foreground">
            {planTokens} included left · {usage?.available ?? 0} available now
            {usage && usage.refillTokens > 0
              ? ` · +${usage.refillTokens} pack balance`
              : ""}
          </p>
        </div>
      </section>

      <section>
        <SectionHeader label="PLANS" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = plan.value === currentPlan;
            const displayFeatures =
              plan.includesPlan !== null
                ? plan.incrementalFeatures
                : plan.features;

            return (
              <div
                key={plan.value}
                className="flex flex-col gap-4 rounded-lg border p-5"
                style={{
                  background: isCurrent
                    ? "color-mix(in oklch, var(--primary) 7%, transparent)"
                    : "var(--c-surface)",
                  borderColor: isCurrent
                    ? "color-mix(in oklch, var(--primary) 35%, transparent)"
                    : "var(--c-border)",
                }}
              >
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <p
                      className="text-sm font-bold"
                      style={{
                        color: isCurrent ? "var(--c-cyan)" : "var(--c-text)",
                      }}
                    >
                      {plan.label}
                    </p>
                    {isCurrent && (
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
                        CURRENT
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    €{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {plan.seats} seat{plan.seats !== 1 ? "s" : ""} included
                  </p>
                  <p>{plan.tokens} screenings / month</p>
                </div>

                <div className="space-y-1.5">
                  {plan.includesPlan && (
                    <p className="text-xs font-semibold text-foreground">
                      Everything in {plan.includesPlan}, plus:
                    </p>
                  )}
                  {displayFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check
                        size={12}
                        className="mt-0.5 shrink-0 text-[#10B981]"
                      />
                      <span className="text-xs text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <Button
                    className="mt-auto w-full"
                    variant="default"
                    onClick={openPortal}
                    disabled={billingPortal.isPending || plan.value === "free"}
                  >
                    {plan.value === "free" ? "Current plan" : "Manage subscription"}
                  </Button>
                ) : plan.value === "free" ? (
                  <Button className="mt-auto w-full" variant="outline" disabled>
                    Downgrade via portal
                  </Button>
                ) : (
                  <Button
                    className="mt-auto w-full"
                    variant="outline"
                    disabled={pending !== null || subscriptionUpgrade.isPending}
                    onClick={() =>
                      switchPlan(plan.value as "starter" | "growth" | "scale")
                    }
                  >
                    {pending === plan.value ? "Redirecting…" : "Upgrade"}
                  </Button>
                )}
              </div>
            );
          })}

          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5">
            <div>
              <p className="text-sm font-bold text-foreground">
                {ENTERPRISE_PLAN.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">Custom</p>
            </div>
            <div className="space-y-1.5">
              {ENTERPRISE_PLAN.features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check size={12} className="mt-0.5 shrink-0 text-[#10B981]" />
                  <span className="text-xs text-foreground">{feature}</span>
                </div>
              ))}
            </div>
            <Button asChild className="mt-auto w-full" variant="outline">
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Enterprise%20plan%20inquiry`}
              >
                Contact us
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader label="TOKEN PACKS" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TOKEN_PACKS.map((pack) => {
            const perToken = (pack.price / pack.tokens).toFixed(2);

            return (
              <div
                key={pack.key}
                className="rounded-lg border border-border bg-card p-4"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {pack.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {pack.tokens} screenings · €{perToken}/screening
                    </p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    €{pack.price}
                  </p>
                </div>
                {usage?.canPurchasePacks ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    disabled={pending !== null || packCheckout.isPending}
                    onClick={() => buyPack(pack.key)}
                  >
                    {pending === pack.key ? "Redirecting…" : "Purchase"}
                  </Button>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Upgrade to a paid plan to purchase token packs
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
