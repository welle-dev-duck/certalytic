"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { useRetryCandidate } from "@/features/candidates/hooks/use-candidates";
import { useTranslations } from "@/lib/i18n/client";

type CandidateRef = {
  id: string;
  name: string;
};

type RerunCandidateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateRef | null;
};

export function RerunCandidateDialog({
  open,
  onOpenChange,
  candidate,
}: RerunCandidateDialogProps) {
  const t = useTranslations("app");
  const retry = useRetryCandidate();

  function confirmRerun() {
    if (!candidate) return;

    retry.mutate(candidate.id, {
      onSuccess: () => {
        toast.success(t("candidates.rerunDialog.toast.success"));
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : t("candidates.rerunDialog.toast.failed"),
        );
      },
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!retry.isPending) onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("candidates.rerunDialog.title")}</DialogTitle>
          <DialogDescription>
            {candidate
              ? t("candidates.rerunDialog.description", { name: candidate.name })
              : t("candidates.rerunDialog.descriptionFallback")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={retry.isPending}
          >
            {t("candidates.rerunDialog.cancel")}
          </Button>
          <Button
            type="button"
            onClick={confirmRerun}
            disabled={retry.isPending || candidate === null}
          >
            {retry.isPending
              ? t("candidates.rerunDialog.confirming")
              : t("candidates.rerunDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
