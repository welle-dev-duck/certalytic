"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";
import { useTranslations } from "@/lib/i18n/client";

type CrossRefStepProps = ScreeningStepProps & {
  canUseProfileUrls: boolean;
};

export function CrossRefStep({
  form,
  errors,
  updateForm,
  canUseProfileUrls,
}: CrossRefStepProps) {
  const t = useTranslations("app");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {t("screening.crossRefStep.description")}
      </p>

      {canUseProfileUrls ? (
        <>
          <div className="grid gap-2">
            <Label htmlFor="screen-linkedin-text">
              {t("screening.crossRefStep.linkedinLabel")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("screening.crossRefStep.linkedinHint")}
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
              placeholder={t("screening.crossRefStep.linkedinPlaceholder")}
            />
            {errors.linkedin_text ? (
              <p className="text-sm text-destructive">
                {errors.linkedin_text}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="screen-github-url">
              {t("screening.crossRefStep.githubLabel")}
            </Label>
            <Input
              id="screen-github-url"
              type="url"
              value={form.githubUrl}
              onChange={(event) => updateForm("githubUrl", event.target.value)}
              maxLength={SCREENING_LIMITS.github_url_max_characters}
              placeholder={t("screening.crossRefStep.githubPlaceholder")}
            />
            {errors.github_url ? (
              <p className="text-sm text-destructive">{errors.github_url}</p>
            ) : null}
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {t("screening.crossRefStep.planRequired")}
          </p>
        </div>
      )}
    </div>
  );
}
