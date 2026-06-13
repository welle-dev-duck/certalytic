import type { ScreeningFormState } from "@/features/candidates/components/start-screening/types";

export function hasCv(form: ScreeningFormState): boolean {
  return form.cvInputMode === "auto"
    ? form.cvFile !== null
    : form.cvText.trim().length >= 50;
}

export function canProceedStep(
  step: number,
  form: ScreeningFormState,
): boolean {
  switch (step) {
    case 1:
      return form.roleId !== null;
    case 2:
      return form.name.trim() !== "" && hasCv(form);
    case 3:
      return true;
    case 4:
      return form.transcriptInputMode === "manual"
        ? form.mergedTranscript.trim().length >= 10
        : form.transcriptFiles.length > 0;
    default:
      return true;
  }
}

export function buildScreeningFormData(
  form: ScreeningFormState,
  canUseProfileUrls: boolean,
): FormData | null {
  if (form.roleId === null) return null;

  const payload = new FormData();
  payload.set("name", form.name.trim());
  payload.set("role_id", form.roleId);
  payload.set("language", form.language);
  payload.set("cv_input_mode", form.cvInputMode);

  if (form.email.trim()) {
    payload.set("email", form.email.trim());
  }

  if (form.cvInputMode === "auto" && form.cvFile) {
    payload.set("cv", form.cvFile);
  }

  if (form.cvInputMode === "manual") {
    payload.set("cv_text", form.cvText.trim());
  }

  if (canUseProfileUrls && form.linkedinText.trim()) {
    payload.set("linkedin_text", form.linkedinText.trim());
  }

  if (canUseProfileUrls && form.githubUrl.trim()) {
    payload.set("github_url", form.githubUrl.trim());
  }

  payload.set("transcript_input_mode", form.transcriptInputMode);

  if (form.transcriptInputMode === "manual") {
    payload.set("transcripts[0]", form.mergedTranscript.trim());
  } else {
    for (const file of form.transcriptFiles) {
      payload.append("transcript_files", file);
    }
  }

  if (form.interviewerNotes.trim()) {
    payload.set("interviewer_notes[0]", form.interviewerNotes.trim());
  }

  return payload;
}
