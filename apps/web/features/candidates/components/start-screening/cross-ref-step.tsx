"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";

type CrossRefStepProps = ScreeningStepProps & {
  canUseProfileUrls: boolean;
};

export function CrossRefStep({
  form,
  errors,
  updateForm,
  canUseProfileUrls,
}: CrossRefStepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Optional cross-reference signals strengthen the integrity score by
        comparing the CV against public profiles.
      </p>

      {canUseProfileUrls ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="screen-linkedin-text">LinkedIn profile</Label>
            <p className="text-sm text-muted-foreground">
              Paste the candidate&apos;s LinkedIn profile content here.
            </p>
            <textarea
              id="screen-linkedin-text"
              value={form.linkedinText}
              onChange={(event) =>
                updateForm("linkedinText", event.target.value)
              }
              maxLength={SCREENING_LIMITS.linkedin_text_max_characters}
              rows={6}
              className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder="Paste headline, experience, education, and skills from the LinkedIn profile…"
            />
            {errors.linkedin_text ? (
              <p className="text-sm text-destructive">
                {errors.linkedin_text}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="screen-github-url">GitHub profile</Label>
            <Input
              id="screen-github-url"
              type="url"
              value={form.githubUrl}
              onChange={(event) => updateForm("githubUrl", event.target.value)}
              maxLength={SCREENING_LIMITS.github_url_max_characters}
              placeholder="https://github.com/username"
            />
            {errors.github_url ? (
              <p className="text-sm text-destructive">{errors.github_url}</p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Cross-reference screening requires a Starter plan or higher. You
            can skip this step and continue with CV and interview analysis only.
          </p>
        </div>
      )}
    </div>
  );
}
