"use client";

import { LoadingSwap } from "@/components/loading-swap";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CandidateStep } from "@/features/candidates/components/start-screening/candidate-step";
import { CrossRefStep } from "@/features/candidates/components/start-screening/cross-ref-step";
import { GeneralStep } from "@/features/candidates/components/start-screening/general-step";
import { InterviewsStep } from "@/features/candidates/components/start-screening/interviews-step";
import { StepIndicator } from "@/features/candidates/components/start-screening/step-indicator";
import { useStartScreeningForm } from "@/features/candidates/hooks/use-start-screening-form";
import { useTranslations } from "@/lib/i18n/client";

type StartScreeningModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRoleId?: string | null;
  lockRole?: boolean;
};

export function StartScreeningModal({
  open,
  onOpenChange,
  preselectedRoleId = null,
  lockRole = false,
}: StartScreeningModalProps) {
  const t = useTranslations("app");
  const screening = useStartScreeningForm({
    open,
    onOpenChange,
    preselectedRoleId,
    lockRole,
  });

  const stepProps = {
    form: screening.form,
    errors: screening.errors,
    updateForm: screening.updateForm,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("screening.modal.title")}</DialogTitle>
          <DialogDescription>
            {t("screening.modal.tokensAvailable", {
              count: screening.tokenAvailable,
            })}
          </DialogDescription>
        </DialogHeader>

        <StepIndicator step={screening.step} />

        {Object.keys(screening.errors).length > 0 ? (
          <Alert variant="destructive">
            <AlertDescription>
              {Object.values(screening.errors).filter(Boolean).join(" ")}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {screening.step === 1 ? (
            <GeneralStep
              {...stepProps}
              roles={screening.roles}
              lockRole={lockRole}
            />
          ) : null}

          {screening.step === 2 ? (
            <CandidateStep
              {...stepProps}
              selectedRole={screening.selectedRole}
              lockRole={lockRole}
              cvTextWords={screening.cvTextWords}
              onChangeRole={() => screening.setStep(1)}
            />
          ) : null}

          {screening.step === 3 ? (
            <CrossRefStep
              {...stepProps}
              canUseProfileUrls={screening.canUseProfileUrls}
            />
          ) : null}

          {screening.step === 4 ? (
            <InterviewsStep
              {...stepProps}
              mergedTranscriptWords={screening.mergedTranscriptWords}
            />
          ) : null}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={screening.goBack}
            disabled={screening.processing}
          >
            {screening.isFirstStep
              ? t("screening.modal.cancel")
              : t("screening.modal.back")}
          </Button>
          {!screening.isLastStep ? (
            <Button
              type="button"
              onClick={() => screening.setStep((current) => current + 1)}
              disabled={!screening.canProceed()}
            >
              {t("screening.modal.continue")}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={screening.submit}
              disabled={screening.processing || !screening.canProceed()}
            >
              <LoadingSwap isLoading={screening.processing}>
                {t("screening.modal.start")}
              </LoadingSwap>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
