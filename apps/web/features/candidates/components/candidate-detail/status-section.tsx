"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";

import { FlagBadge } from "@/components/certalytic/status-badge";
import { ScreeningProcessingStatus } from "@/features/candidates/components/screening-processing-status";
import type {
  CandidateDetail,
  CandidateReport,
} from "@/features/candidates/types";
import { useTranslations } from "@/lib/i18n/client";
import type { Flag } from "@/lib/integrity";

type CandidateDetailStatusSectionProps = {
  candidate: CandidateDetail;
  report: CandidateReport | undefined;
  isComplete: boolean;
  isOngoing: boolean;
};

export function CandidateDetailStatusSection({
  candidate,
  report,
  isComplete,
  isOngoing,
}: CandidateDetailStatusSectionProps) {
  const t = useTranslations("app");

  if (isComplete) {
    if (!report || report.flags.length === 0) return null;

    const flagsKey =
      report.flags.length === 1
        ? "candidates.detail.activeFlagsSingular"
        : "candidates.detail.activeFlagsPlural";

    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle size={14} className="text-destructive" />
          <p className="text-sm font-semibold text-destructive">
            {t(flagsKey, { count: report.flags.length })}
          </p>
        </div>
        <div className="space-y-2">
          {report.flags.map((flag, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded bg-black/20 p-2.5"
            >
              <FlagBadge flag={flag as Flag} />
              <p className="flex-1 text-xs text-foreground">{flag.description}</p>
              <span className="shrink-0 rounded bg-chart-2/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                {Math.round(flag.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (candidate.status === "failed") {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <AlertTriangle size={20} className="mx-auto mb-2 text-destructive" />
        <p className="text-sm font-semibold text-destructive">
          {t("candidates.detail.screeningFailed")}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {candidate.errorMessage ??
            t("candidates.detail.screeningFailedFallback")}
        </p>
      </div>
    );
  }

  if (isOngoing) {
    return <ScreeningProcessingStatus startedAt={candidate.createdAt} />;
  }

  return null;
}
