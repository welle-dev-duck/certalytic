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
  const router = useRouter();
  const deleteCandidate = useDeleteCandidate();

  async function confirmDelete() {
    if (!candidate) return;

    try {
      await deleteCandidate.mutateAsync(candidate.id);
      toast.success("Candidate deleted.");
      onOpenChange(false);
      onDeleted?.();
      router.push(routes.candidates());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete candidate.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete candidate?</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <>
                This will permanently delete{" "}
                <span className="font-semibold text-foreground">
                  {candidate.name}
                </span>
                , including interview transcripts and integrity scores. This
                action cannot be undone.
              </>
            ) : (
              "This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void confirmDelete()}
            disabled={candidate === null || deleteCandidate.isPending}
          >
            Delete candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
