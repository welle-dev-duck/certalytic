"use client";

import type { SupplementaryAnalysis } from "@/features/candidates/types";
import { useTranslations } from "@/lib/i18n/client";

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="mb-3 text-sm font-semibold text-foreground">{title}</p>
      {children}
    </div>
  );
}

export function SupplementaryAnalysisPanel({
  title,
  analysis,
  indicatorLabel,
  showMotivation = false,
}: {
  title: string;
  analysis: SupplementaryAnalysis;
  indicatorLabel: string;
  showMotivation?: boolean;
}) {
  const t = useTranslations("app");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Panel title={title}>
          <p className="mb-4 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-muted-foreground">
            {t("dossier.supplementary.disclaimer")}
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {analysis.summary}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-border bg-muted/20 p-3">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                {analysis.detailLabel}
              </p>
              <p className="mt-2 text-sm text-foreground">{analysis.detail}</p>
            </div>
            {analysis.traits.length > 0 && (
              <div className="rounded border border-border bg-muted/20 p-3">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  {t("dossier.supplementary.observedTraits")}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-foreground">
                  {analysis.traits.map((trait) => (
                    <li key={trait}>• {trait}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Panel>
      </div>
      <div className="space-y-4">
        {analysis.indicators.length > 0 && (
          <Panel title={indicatorLabel}>
            <ul className="space-y-2 text-xs text-foreground">
              {analysis.indicators.map((indicator) => (
                <li
                  key={indicator}
                  className="rounded border border-border bg-muted/20 p-2.5"
                >
                  {indicator}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {showMotivation && analysis.motivationSignals.length > 0 && (
          <Panel title={t("dossier.supplementary.motivationSignals")}>
            <ul className="space-y-2 text-xs text-foreground">
              {analysis.motivationSignals.map((signal) => (
                <li
                  key={signal}
                  className="rounded border border-border bg-muted/20 p-2.5"
                >
                  {signal}
                </li>
              ))}
            </ul>
          </Panel>
        )}
        {analysis.concerns.length > 0 && (
          <Panel title={t("dossier.supplementary.watchpoints")}>
            <ul className="space-y-2 text-xs text-foreground">
              {analysis.concerns.map((concern) => (
                <li
                  key={concern}
                  className="rounded border border-destructive/20 bg-destructive/5 p-2.5"
                >
                  {concern}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>
    </div>
  );
}
