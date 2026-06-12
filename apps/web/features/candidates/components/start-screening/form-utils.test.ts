import { describe, expect, it } from "vitest";

import {
  buildScreeningFormData,
  canProceedStep,
  hasCv,
} from "@/features/candidates/components/start-screening/form-utils";
import { buildInitialFormState } from "@/features/candidates/components/start-screening/types";

const baseForm = buildInitialFormState([], null, false);

describe("start-screening form utils", () => {
  it("requires role on step 1", () => {
    expect(canProceedStep(1, { ...baseForm, roleId: null })).toBe(false);
    expect(canProceedStep(1, { ...baseForm, roleId: "role-1" })).toBe(true);
  });

  it("requires name and cv on step 2", () => {
    expect(
      canProceedStep(2, {
        ...baseForm,
        name: "Jane Doe",
        cvInputMode: "manual",
        cvText: "short",
      }),
    ).toBe(false);
    expect(
      hasCv({
        ...baseForm,
        cvInputMode: "manual",
        cvText: "x".repeat(50),
      }),
    ).toBe(true);
  });

  it("builds multipart payload for submission", () => {
    const form = {
      ...baseForm,
      name: "Jane Doe",
      roleId: "role-1",
      cvInputMode: "manual" as const,
      cvText: "x".repeat(50),
      mergedTranscript: "Interview transcript content here",
      transcriptInputMode: "manual" as const,
    };

    const payload = buildScreeningFormData(form, true);
    expect(payload?.get("name")).toBe("Jane Doe");
    expect(payload?.get("role_id")).toBe("role-1");
    expect(payload?.get("cv_text")).toBe("x".repeat(50));
  });
});
