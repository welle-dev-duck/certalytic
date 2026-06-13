"use client";

import { MARKETING_ROADMAP } from "@/lib/marketing-data";
import { useTranslations } from "@/lib/i18n/client";

export function MarketingRoadmapSection() {
  const t = useTranslations("marketing");

  return (
    <section
      id="roadmap"
      className="border-y border-border bg-card/40 py-20 md:py-24"
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            {t("roadmap.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("roadmap.description")}</p>
        </div>

        <ol className="grid gap-4 md:grid-cols-2">
          {MARKETING_ROADMAP.map((item, index) => (
            <li
              key={item.id}
              className="relative border border-border bg-background p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase">
                  {item.quarter}
                </span>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  #{String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                {t(`roadmap.items.${item.id}.title`)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t(`roadmap.items.${item.id}.description`)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
