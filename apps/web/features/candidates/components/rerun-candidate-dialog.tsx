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
  const retry = useRetryCandidate();

  function confirmRerun() {
    if (!candidate) return;

    retry.mutate(candidate.id, {
      onSuccess: () => {
        toast.success("Screening re-queued.");
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Failed to re-run screening.",
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
          <DialogTitle>Re-run screening?</DialogTitle>
          <DialogDescription>
            {candidate ? (
              <>
                This will re-analyze{" "}
                <span className="font-semibold text-foreground">
                  {candidate.name}
                </span>{" "}
                using the stored CV and merged interview transcripts. The current
                integrity score will be replaced. This consumes{" "}
                <span className="font-semibold text-foreground">1 token</span>.
              </>
            ) : (
              "Re-running replaces the current analysis and consumes 1 token."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={retry.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={confirmRerun}
            disabled={retry.isPending || candidate === null}
          >
            {retry.isPending ? "Re-queuing…" : "Re-run screening"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
