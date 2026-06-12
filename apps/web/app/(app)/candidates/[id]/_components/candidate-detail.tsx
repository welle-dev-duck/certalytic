"use client";

import { useEffect, useState } from "react";

import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { CandidateDetailHeader } from "@/features/candidates/components/candidate-detail/header";
import { CandidateDetailStatusSection } from "@/features/candidates/components/candidate-detail/status-section";
import { CandidateDetailSummary } from "@/features/candidates/components/candidate-detail/summary-cards";
import { CandidateDossierTabs } from "@/features/candidates/components/dossier/candidate-dossier-tabs";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import {
  useCandidate,
  useCandidateReport,
} from "@/features/candidates/hooks/use-candidates";
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

      <CandidateDetailHeader
        candidate={candidate}
        isComplete={isComplete}
        onRerun={() => setRerunOpen(true)}
        onDelete={() => setDeleteOpen(true)}
      />

      <CandidateDetailSummary
        candidate={candidate}
        report={report}
        isComplete={isComplete}
        score={score}
        flagCount={flagCount}
        roundCount={roundCount}
      />

      <CandidateDetailStatusSection
        candidate={candidate}
        report={report}
        isComplete={isComplete}
        isOngoing={isOngoing}
      />

      {isComplete && report ? (
        <CandidateDossierTabs candidate={candidate} report={report} />
      ) : null}
    </div>
  );
}
