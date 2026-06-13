"use client";

import { MARKETING_STATS } from "@/lib/marketing-data";
import { useTranslations } from "@/lib/i18n/client";

const statItems = [
  {
    valueKey: "candidates_screened" as const,
    labelKey: "stats.items.candidatesScreened.label",
    detailKey: "stats.items.candidatesScreened.detail",
  },
  {
    valueKey: "customers" as const,
    labelKey: "stats.items.teams.label",
    detailKey: "stats.items.teams.detail",
    detailParams: { countries: MARKETING_STATS.countries },
  },
  {
    valueKey: "audio_hours" as const,
    labelKey: "stats.items.audioHours.label",
    detailKey: "stats.items.audioHours.detail",
  },
  {
    valueKey: "saved_millions" as const,
    labelKey: "stats.items.savedMillions.label",
    detailKey: "stats.items.savedMillions.detail",
  },
] as const;

export function MarketingStatsSection() {
  const t = useTranslations("marketing");

  return (
    <section className="border-y border-border py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
          {t("stats.eyebrow")}
        </p>
        <h2 className="mt-3 text-center font-serif text-3xl tracking-tight text-primary md:text-4xl">
          {t("stats.title")}
        </h2>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statItems.map((item) => (
            <div
              key={item.labelKey}
              className="border border-border bg-primary/5 p-6 text-center"
            >
              <p className="font-serif text-4xl tracking-tight text-primary tabular-nums md:text-5xl">
                {MARKETING_STATS[item.valueKey]}
              </p>
              <p className="mt-3 text-sm font-semibold text-primary">
                {t(item.labelKey)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {"detailParams" in item
                  ? t(item.detailKey, item.detailParams)
                  : t(item.detailKey)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
