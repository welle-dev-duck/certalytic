"use client";

import { Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { TokenUsageBar } from "@/components/billing/token-usage-bar";
import { Button } from "@/components/ui/button";
import {
  EnterprisePlanCard,
  PAID_SUBSCRIPTION_PLANS,
  SubscriptionPlanCard,
} from "@/features/billing/components/plan-cards";
import { CONTACT_EMAIL, TOKEN_PACKS } from "@/features/billing/plans";
import {
  useBillingPortal,
  useBillingUsage,
  usePackCheckout,
  useSubscriptionUpgrade,
} from "@/features/billing/hooks/use-billing";
import { useTranslations } from "@/lib/i18n/client";

const PACK_NAME_KEYS: Record<(typeof TOKEN_PACKS)[number]["key"], string> = {
  quick_refill: "billing.packs.quickRefill",
  pipeline_surge: "billing.packs.pipelineSurge",
  high_volume_boost: "billing.packs.highVolumeBoost",
};

function SectionHeader({ label }: { label: string }) {
  return (
    <p className="mb-4 text-[10px] font-bold tracking-widest text-muted-foreground">
      {label}
    </p>
  );
}

export function BillingView() {
  const t = useTranslations("app");
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
  const currentPlanLabel = t(`billing.plans.${currentPlan}.label`);

  function buyPack(key: (typeof TOKEN_PACKS)[number]["key"]) {
    setPending(key);
    packCheckout.mutate(key, {
      onSettled: () => setPending(null),
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t("billing.toast.checkoutFailed"),
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
          error instanceof Error
            ? error.message
            : t("billing.toast.checkoutFailed"),
        );
      },
    });
  }

  function openPortal() {
    billingPortal.mutate(undefined, {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t("billing.toast.portalFailed"),
        );
      },
    });
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">
          {t("billing.title")}
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("billing.subtitle")}
        </p>
      </div>

      <section>
        <SectionHeader label={t("billing.sections.tokenUsage")} />
        <div className="space-y-3 rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-primary" />
              <p className="text-xs font-semibold text-foreground">
                {t("billing.usage.includedTokens")}
              </p>
            </div>
            <p className="font-mono text-xs font-bold text-foreground">
              {t("billing.usage.usedOfQuota", {
                used: tokenUsed,
                quota: planQuota || "-",
              })}
            </p>
          </div>
          {planQuota > 0 && (
            <TokenUsageBar usedPct={tokenPct / 100} className="h-2" />
          )}
          <p className="text-[10px] text-muted-foreground">
            {t("billing.usage.summary", {
              includedLeft: planTokens,
              available: usage?.available ?? 0,
            })}
            {usage && usage.refillTokens > 0
              ? t("billing.usage.packBalance", { count: usage.refillTokens })
              : ""}
          </p>
        </div>
      </section>

      <section>
        <SectionHeader label={t("billing.sections.plans")} />
        <p className="mb-4 text-sm text-muted-foreground">
          {t("billing.currentPlan")}{" "}
          <span className="font-semibold text-foreground">
            {currentPlanLabel}
          </span>
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {PAID_SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = plan.value === currentPlan;

            return (
              <SubscriptionPlanCard
                key={plan.value}
                plan={plan}
                highlighted={isCurrent || plan.value === "growth"}
                badge={isCurrent ? t("billing.plans.badgeCurrent") : undefined}
                footer={
                  isCurrent ? (
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={openPortal}
                      disabled={billingPortal.isPending}
                    >
                      {t("billing.plans.manageSubscription")}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={pending !== null || subscriptionUpgrade.isPending}
                      onClick={() =>
                        switchPlan(
                          plan.value as "starter" | "growth" | "scale",
                        )
                      }
                    >
                      {pending === plan.value
                        ? t("billing.plans.redirecting")
                        : t("billing.plans.upgrade")}
                    </Button>
                  )
                }
              />
            );
          })}

          <EnterprisePlanCard
            footer={
              <Button asChild className="w-full" variant="outline">
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=Enterprise%20plan%20inquiry`}
                >
                  {t("billing.plans.enterprise.contactUs")}
                </a>
              </Button>
            }
          />
        </div>
      </section>

      <section>
        <SectionHeader label={t("billing.sections.tokenPacks")} />
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
                      {t(PACK_NAME_KEYS[pack.key])}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t("billing.packs.summary", {
                        tokens: pack.tokens,
                        perToken,
                      })}
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
                    {pending === pack.key
                      ? t("billing.plans.redirecting")
                      : t("billing.packs.purchase")}
                  </Button>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    {t("billing.packs.upgradeRequired")}
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
