import type { RoleListItem } from "@/features/roles/types";
import type { Translator } from "@/lib/i18n/translate";

export type ScreeningFormState = {
  name: string;
  email: string;
  roleId: string | null;
  cvInputMode: "auto" | "manual";
  cvFile: File | null;
  cvText: string;
  linkedinText: string;
  githubUrl: string;
  transcriptInputMode: "manual" | "auto";
  mergedTranscript: string;
  transcriptFiles: File[];
  interviewerNotes: string;
};

export const SCREENING_STEP_COUNT = 4;

export function getScreeningSteps(t: Translator) {
  return [
    {
      id: 1,
      title: t("screening.steps.role.title"),
      description: t("screening.steps.role.description"),
    },
    {
      id: 2,
      title: t("screening.steps.candidate.title"),
      description: t("screening.steps.candidate.description"),
    },
    {
      id: 3,
      title: t("screening.steps.crossRef.title"),
      description: t("screening.steps.crossRef.description"),
    },
    {
      id: 4,
      title: t("screening.steps.interviews.title"),
      description: t("screening.steps.interviews.description"),
    },
  ] as const;
}

export function buildInitialFormState(
  roles: RoleListItem[],
  preselectedRoleId?: string | null,
  lockRole = false,
): ScreeningFormState {
  const selected = roles.find((role) => role.id === preselectedRoleId);

  return {
    name: "",
    email: "",
    roleId: lockRole
      ? (selected?.id ?? preselectedRoleId ?? null)
      : (selected?.id ?? roles[0]?.id ?? null),
    cvInputMode: "auto",
    cvFile: null,
    cvText: "",
    linkedinText: "",
    githubUrl: "",
    transcriptInputMode: "manual",
    mergedTranscript: "",
    transcriptFiles: [],
    interviewerNotes: "",
  };
}

export type ScreeningStepProps = {
  form: ScreeningFormState;
  errors: Record<string, string>;
  updateForm: <K extends keyof ScreeningFormState>(
    key: K,
    value: ScreeningFormState[K],
  ) => void;
};
