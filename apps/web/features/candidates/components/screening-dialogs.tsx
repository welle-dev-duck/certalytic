"use client";

import { DeleteCandidateDialog } from "@/features/candidates/components/delete-candidate-dialog";
import { RerunCandidateDialog } from "@/features/candidates/components/rerun-candidate-dialog";
import { StartScreeningModal } from "@/features/candidates/components/start-screening-modal";

type ScreeningDialogsProps = {
  screenOpen: boolean;
  onScreenOpenChange: (open: boolean) => void;
  deleteOpen: boolean;
  onDeleteOpenChange: (open: boolean) => void;
  rerunOpen: boolean;
  onRerunOpenChange: (open: boolean) => void;
  selectedCandidate: { id: string; name: string } | null;
  preselectedRoleId?: string | null;
  lockRole?: boolean;
};

export function ScreeningDialogs({
  screenOpen,
  onScreenOpenChange,
  deleteOpen,
  onDeleteOpenChange,
  rerunOpen,
  onRerunOpenChange,
  selectedCandidate,
  preselectedRoleId = null,
  lockRole = false,
}: ScreeningDialogsProps) {
  return (
    <>
      <DeleteCandidateDialog
        open={deleteOpen}
        onOpenChange={onDeleteOpenChange}
        candidate={selectedCandidate}
      />
      <RerunCandidateDialog
        open={rerunOpen}
        onOpenChange={onRerunOpenChange}
        candidate={selectedCandidate}
      />
      <StartScreeningModal
        open={screenOpen}
        onOpenChange={onScreenOpenChange}
        preselectedRoleId={preselectedRoleId}
        lockRole={lockRole}
      />
    </>
  );
}
