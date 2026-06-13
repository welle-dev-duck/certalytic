"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteCandidate } from "@/features/candidates/hooks/use-candidates";
import { useTranslations } from "@/lib/i18n/client";
import { routes } from "@/lib/routes";

type CandidateRef = {
  id: string;
  name: string;
};

type DeleteCandidateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: CandidateRef | null;
  onDeleted?: () => void;
};

export function DeleteCandidateDialog({
  open,
  onOpenChange,
  candidate,
  onDeleted,
}: DeleteCandidateDialogProps) {
  const t = useTranslations("app");
  const router = useRouter();
  const deleteCandidate = useDeleteCandidate();

  async function confirmDelete() {
    if (!candidate) return;

    try {
      await deleteCandidate.mutateAsync(candidate.id);
      toast.success(t("candidates.deleteDialog.toast.success"));
      onOpenChange(false);
      onDeleted?.();
      router.push(routes.candidates());
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("candidates.deleteDialog.toast.failed"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("candidates.deleteDialog.title")}</DialogTitle>
          <DialogDescription>
            {candidate
              ? t("candidates.deleteDialog.description", { name: candidate.name })
              : t("candidates.deleteDialog.descriptionFallback")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("candidates.deleteDialog.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmDelete()}
            disabled={candidate === null || deleteCandidate.isPending}
          >
            {t("candidates.deleteDialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
