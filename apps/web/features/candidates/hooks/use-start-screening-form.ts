"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  buildScreeningFormData,
  canProceedStep,
} from "@/features/candidates/components/start-screening/form-utils";
import {
  SCREENING_STEPS,
  buildInitialFormState,
  type ScreeningFormState,
} from "@/features/candidates/components/start-screening/types";
import { getPlanFeatures } from "@/features/billing/lib/plan-features";
import { useBillingUsage } from "@/features/billing/hooks/use-billing";
import { useCreateCandidate } from "@/features/candidates/hooks/use-candidates";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";
import {
  createScreeningSchema,
  firstZodError,
  formatZodErrors,
} from "@/features/candidates/lib/screening-schema";
import { useRoles } from "@/features/roles/hooks/use-roles";
import { ApiError } from "@/lib/api-client";
import { handleMutationError, mapValidationErrors } from "@/lib/mutation-errors";
import { routes } from "@/lib/routes";

type UseStartScreeningFormOptions = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedRoleId?: string | null;
  lockRole?: boolean;
};

export function useStartScreeningForm({
  open,
  onOpenChange,
  preselectedRoleId = null,
  lockRole = false,
}: UseStartScreeningFormOptions) {
  const router = useRouter();
  const createCandidate = useCreateCandidate();
  const { data: usage } = useBillingUsage();
  const { data: rolesData } = useRoles({ limit: 100 }, { enabled: open });
  const roles = rolesData?.data ?? [];

  const planFeatures = getPlanFeatures(usage?.plan);
  const canUseProfileUrls =
    planFeatures.crossSource || planFeatures.crossSourceManual;

  const initialStep = lockRole ? 2 : 1;
  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ScreeningFormState>(() =>
    buildInitialFormState(roles, preselectedRoleId, lockRole),
  );

  const screeningSchema = useMemo(
    () => createScreeningSchema(SCREENING_LIMITS),
    [],
  );

  const selectedRole = roles.find((role) => role.id === form.roleId);
  const mergedTranscriptWords = form.mergedTranscript.trim()
    ? form.mergedTranscript.trim().split(/\s+/).length
    : 0;
  const cvTextWords = form.cvText.trim()
    ? form.cvText.trim().split(/\s+/).length
    : 0;

  useEffect(() => {
    if (!open) return;
    setStep(lockRole ? 2 : 1);
    setErrors({});
    setForm(buildInitialFormState(roles, preselectedRoleId, lockRole));
    // Reset only when the dialog opens — roles is memoized from query data.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roles read at open time
  }, [open, preselectedRoleId, lockRole]);

  function updateForm<K extends keyof ScreeningFormState>(
    key: K,
    value: ScreeningFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function canProceed() {
    return canProceedStep(step, form);
  }

  function submit() {
    const parsed = screeningSchema.safeParse({
      name: form.name,
      email: form.email,
      roleId: form.roleId,
      cvInputMode: form.cvInputMode,
      cvFile: form.cvFile,
      cvText: form.cvText,
      linkedinText: form.linkedinText,
      githubUrl: form.githubUrl,
      transcriptInputMode: form.transcriptInputMode,
      mergedTranscript: form.mergedTranscript,
      transcriptFiles: form.transcriptFiles,
      interviewerNotes: form.interviewerNotes,
    });

    if (!parsed.success) {
      const fieldErrors = formatZodErrors(parsed.error);
      setErrors(fieldErrors);
      toast.error(firstZodError(parsed.error));
      return;
    }

    const payload = buildScreeningFormData(form, canUseProfileUrls);
    if (!payload) return;

    setErrors({});

    createCandidate.mutate(payload, {
      onSuccess: (result) => {
        toast.success("Screening started.");
        onOpenChange(false);
        router.push(routes.candidate(result.id));
      },
      onError: (error) => {
        if (error instanceof ApiError && error.validationErrors) {
          setErrors(mapValidationErrors(error.validationErrors));
        }

        handleMutationError(error, {
          fallbackMessage: "Failed to start screening.",
        });
      },
    });
  }

  function goBack() {
    if (step === 1 || (lockRole && step === 2)) {
      onOpenChange(false);
    } else {
      setStep((current) => current - 1);
    }
  }

  const isFirstStep = step === 1 || (lockRole && step === 2);
  const isLastStep = step >= SCREENING_STEPS.length;
  const processing = createCandidate.isPending;
  const tokenAvailable = usage?.available ?? 0;

  return {
    step,
    setStep,
    form,
    errors,
    updateForm,
    roles,
    selectedRole,
    lockRole,
    canUseProfileUrls,
    cvTextWords,
    mergedTranscriptWords,
    canProceed,
    submit,
    goBack,
    isFirstStep,
    isLastStep,
    processing,
    tokenAvailable,
  };
}
