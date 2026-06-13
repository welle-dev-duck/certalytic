"use client";

import { IntegrityRadarChart } from "@/components/certalytic/integrity-radar-chart";
import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { formatReportDate } from "@/features/candidates/lib/report-utils";
import type {
  CandidateDetail,
  CandidateReport,
} from "@/features/candidates/types";
import { useTranslations } from "@/lib/i18n/client";

type CandidateDetailSummaryProps = {
  candidate: CandidateDetail;
  report: CandidateReport | undefined;
  isComplete: boolean;
  score: number;
  flagCount: number;
  roundCount: number;
};

export function CandidateDetailSummary({
  candidate,
  report,
  isComplete,
  score,
  flagCount,
  roundCount,
}: CandidateDetailSummaryProps) {
  const t = useTranslations("app");
  const flagsKey =
    flagCount === 1
      ? "candidates.detail.flagsCountSingular"
      : "candidates.detail.flagsCountPlural";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center">
            {isComplete ? (
              <ScoreRing
                score={score}
                size={120}
                strokeWidth={8}
                labelSize="lg"
              />
            ) : (
              <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground">
                -
              </div>
            )}
            <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-muted-foreground">
              {t("candidates.detail.hiringIntegrityScore")}
            </p>
            {isComplete && report ? (
              <div className="mt-3">
                <IntegrityBadge level={report.level} />
              </div>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {candidate.name}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {candidate.roleTitle ?? "-"}
                </p>
              </div>
              <StatusBadge status={candidate.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded bg-muted p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("candidates.detail.status")}
                </p>
                <div className="mt-1">
                  <StatusBadge status={candidate.status} />
                </div>
              </div>
              <div className="rounded bg-muted p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("candidates.detail.scanCreatedAt")}
                </p>
                <p className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                  {formatReportDate(candidate.processedAt)}
                </p>
              </div>
              <div className="rounded bg-muted p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("candidates.detail.flagsRaised")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {t(flagsKey, { count: flagCount })}
                </p>
              </div>
              <div className="rounded bg-muted p-2.5">
                <p className="text-[10px] font-medium text-muted-foreground">
                  {t("candidates.detail.interviewRounds")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {roundCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-lg border border-border bg-card p-5">
        <p className="mb-2 text-[10px] font-bold tracking-widest text-muted-foreground">
          {t("candidates.detail.signalProfile")}
        </p>
        {isComplete && report ? (
          <IntegrityRadarChart data={report.radar} />
        ) : (
          <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
            {t("candidates.detail.availableWhenComplete")}
          </div>
        )}
      </div>
    </div>
  );
}
