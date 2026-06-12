"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Download,
  RefreshCw,
  Trash2,
} from "lucide-react";
import Link from "@/components/ui/link";
import { useEffect, useState } from "react";

import { IntegrityRadarChart } from "@/components/certalytic/integrity-radar-chart";
import { ScoreRing } from "@/components/certalytic/score-ring";
import {
  FlagBadge,
  IntegrityBadge,
  StatusBadge,
} from "@/components/certalytic/status-badge";
import { Button } from "@/components/ui/button";
import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { CandidateDossierTabs } from "@/features/candidates/components/dossier/candidate-dossier-tabs";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import { ScreeningProcessingStatus } from "@/features/candidates/components/screening-processing-status";
import {
  useCandidate,
  useCandidateReport,
} from "@/features/candidates/hooks/use-candidates";
import { formatReportDate } from "@/features/candidates/lib/report-utils";
import { apiUrl } from "@/lib/api-client";
import type { Flag } from "@/lib/integrity";
import { routes } from "@/lib/routes";
import { useRealtime } from "@/providers/realtime-provider";

export function CandidateDetail({ candidateId }: { candidateId: string }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [rerunOpen, setRerunOpen] = useState(false);

  const { isConnected } = useRealtime();
  const { data: candidate, isLoading, refetch } = useCandidate(candidateId);
  const isProcessing =
    candidate?.status === "pending" || candidate?.status === "processing";
  const isComplete = candidate?.status === "complete";
  const isOngoing = isProcessing;

  const { data: report } = useCandidateReport(candidateId, isComplete);

  useEffect(() => {
    if (!isProcessing || isConnected) return;
    const interval = setInterval(() => void refetch(), 10_000);
    return () => clearInterval(interval);
  }, [isProcessing, isConnected, refetch]);

  if (isLoading || !candidate) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-muted-foreground">
        Loading candidate…
      </div>
    );
  }

  const score = report?.score ?? candidate.integrityScore ?? 0;
  const flagCount = report?.flags.length ?? 0;
  const roundCount = report?.rounds.length ?? candidate.roundsCount;

  return (
    <div className="space-y-5 p-6">
      <DeleteCandidateDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        candidate={{ id: candidate.id, name: candidate.name }}
      />
      <RerunCandidateDialog
        open={rerunOpen}
        onOpenChange={setRerunOpen}
        candidate={{ id: candidate.id, name: candidate.name }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.candidates()}>
            <ArrowLeft size={14} />
            Back to Candidates
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {isComplete && (
            <Button size="sm" variant="outline" asChild>
              <a
                href={apiUrl(`/api/candidates/${candidate.id}/export`)}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={14} />
                Export PDF
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRerunOpen(true)}
          >
            <RefreshCw size={14} />
            Re-run
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

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
                  —
                </div>
              )}
              <p className="mt-3 text-center text-[10px] font-bold tracking-widest text-muted-foreground">
                HIRING INTEGRITY
                <br />
                SCORE
              </p>
              {isComplete && report && (
                <div className="mt-3">
                  <IntegrityBadge level={report.level} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {candidate.name}
                  </h1>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {candidate.roleTitle ?? "—"}
                  </p>
                </div>
                <StatusBadge status={candidate.status} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded bg-muted p-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={candidate.status} />
                  </div>
                </div>
                <div className="rounded bg-muted p-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Scan Created At
                  </p>
                  <p className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                    {formatReportDate(candidate.processedAt)}
                  </p>
                </div>
                <div className="rounded bg-muted p-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Flags Raised
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {flagCount} flag{flagCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="rounded bg-muted p-2.5">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Interview Rounds
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
            SIGNAL PROFILE
          </p>
          {isComplete && report ? (
            <IntegrityRadarChart
              data={report.radar}
              className="flex flex-1 items-center"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center py-8 text-xs text-muted-foreground">
              Available when screening completes
            </div>
          )}
        </div>
      </div>

      {!isComplete &&
        (candidate.status === "failed" ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <AlertTriangle
              size={20}
              className="mx-auto mb-2 text-destructive"
            />
            <p className="text-sm font-semibold text-destructive">
              Screening failed
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {candidate.errorMessage ??
                "The screening could not be completed."}
            </p>
          </div>
        ) : isOngoing ? (
          <ScreeningProcessingStatus startedAt={candidate.createdAt} />
        ) : null)}

      {isComplete && report && report.flags.length > 0 && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle size={14} className="text-destructive" />
            <p className="text-sm font-semibold text-destructive">
              {report.flags.length} Active Flag
              {report.flags.length > 1 ? "s" : ""} Detected
            </p>
          </div>
          <div className="space-y-2">
            {report.flags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded bg-black/20 p-2.5"
              >
                <FlagBadge flag={flag as Flag} />
                <p className="flex-1 text-xs text-foreground">
                  {flag.description}
                </p>
                <span className="shrink-0 rounded bg-chart-2/15 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                  {Math.round(flag.confidence * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isComplete && report && (
        <CandidateDossierTabs candidate={candidate} report={report} />
      )}
    </div>
  );
}
