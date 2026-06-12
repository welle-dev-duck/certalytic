import type { RoleListItem } from "@/features/roles/types";

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

export const SCREENING_STEPS = [
  { id: 1, title: "Role", description: "Choose the position" },
  { id: 2, title: "Candidate", description: "Details & CV" },
  { id: 3, title: "Cross-ref", description: "LinkedIn & GitHub" },
  { id: 4, title: "Interviews", description: "Merged transcripts" },
] as const;

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
