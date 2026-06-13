"use client";

import { MarketingScreenshotPlaceholder } from "@/components/marketing/marketing-screenshot-placeholder";
import { useTranslations } from "@/lib/i18n/client";

const processStepConfig = [
  {
    step: 1,
    titleKey: "process.steps.1.title",
    descriptionKey: "process.steps.1.description",
    screenshots: [
      {
        filename: "process-create-role.png",
        labelKey: "process.steps.1.screenshots.createRole",
      },
    ],
  },
  {
    step: 2,
    titleKey: "process.steps.2.title",
    descriptionKey: "process.steps.2.description",
    screenshots: [
      {
        filename: "process-candidate-details.png",
        labelKey: "process.steps.2.screenshots.candidateDetails",
      },
      {
        filename: "process-candidate-crossref.png",
        labelKey: "process.steps.2.screenshots.crossRef",
      },
      {
        filename: "process-candidate-transcripts.png",
        labelKey: "process.steps.2.screenshots.transcripts",
      },
    ],
  },
  {
    step: 3,
    titleKey: "process.steps.3.title",
    descriptionKey: "process.steps.3.description",
    screenshots: [
      {
        filename: "process-export-report.png",
        labelKey: "process.steps.3.screenshots.exportReport",
      },
    ],
  },
] as const;

export function MarketingProcessSection() {
  const t = useTranslations("marketing");

  return (
    <section id="process" className="border-b border-border py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-14 max-w-2xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase">
            {t("process.eyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl tracking-tight md:text-4xl">
            {t("process.title")}
          </h2>
          <p className="mt-3 text-muted-foreground">{t("process.description")}</p>
        </div>

        <div className="space-y-20">
          {processStepConfig.map((item) => (
            <div
              key={item.step}
              className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12"
            >
              <div className="lg:sticky lg:top-24">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 font-serif text-lg font-bold text-primary">
                  {item.step}
                </div>
                <h3 className="mt-4 font-serif text-2xl tracking-tight text-foreground">
                  {t(item.titleKey)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t(item.descriptionKey)}
                </p>
              </div>

              <div
                className={
                  item.screenshots.length > 1
                    ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                    : "max-w-2xl"
                }
              >
                {item.screenshots.map((screenshot) => (
                  <MarketingScreenshotPlaceholder
                    key={screenshot.filename}
                    filename={screenshot.filename}
                    label={t(screenshot.labelKey)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
