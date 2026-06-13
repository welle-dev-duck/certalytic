"use client";

import { FileDropzone } from "@/components/file-dropzone";
import { Required } from "@/components/required";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import { SCREENING_LIMITS } from "@/features/candidates/lib/screening-limits";
import type { RoleListItem } from "@/features/roles/types";
import { useTranslations } from "@/lib/i18n/client";

type CandidateStepProps = ScreeningStepProps & {
  selectedRole: RoleListItem | undefined;
  lockRole: boolean;
  cvTextWords: number;
  onChangeRole: () => void;
};

export function CandidateStep({
  form,
  errors,
  updateForm,
  selectedRole,
  lockRole,
  cvTextWords,
  onChangeRole,
}: CandidateStepProps) {
  const t = useTranslations("app");
  const maxMb = Math.round(SCREENING_LIMITS.cv_max_kilobytes / 1024);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="screen-name">
            <Required>{t("screening.candidateStep.name")}</Required>
          </Label>
          <Input
            id="screen-name"
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            maxLength={SCREENING_LIMITS.name_max_characters}
            required
          />
          {errors.name ? (
            <p className="text-sm text-destructive">{errors.name}</p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="screen-email">
            {t("screening.candidateStep.email")}
          </Label>
          <Input
            id="screen-email"
            type="email"
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            maxLength={SCREENING_LIMITS.email_max_characters}
          />
          {errors.email ? (
            <p className="text-sm text-destructive">{errors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 px-3 py-2">
        <p className="text-xs text-muted-foreground">
          {t("screening.candidateStep.applyingFor")}
        </p>
        <p className="text-sm font-medium text-foreground">
          {selectedRole?.title ?? t("screening.candidateStep.noRoleSelected")}
        </p>
        {!lockRole ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-auto px-0"
            onClick={onChangeRole}
          >
            {t("screening.candidateStep.changeRole")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label>
          <Required>{t("screening.candidateStep.cvLabel")}</Required>
        </Label>
        <Tabs
          value={form.cvInputMode}
          onValueChange={(value) =>
            updateForm("cvInputMode", value as ScreeningStepProps["form"]["cvInputMode"])
          }
        >
          <TabsList>
            <TabsTrigger value="auto">
              {t("screening.candidateStep.uploadTab")}
            </TabsTrigger>
            <TabsTrigger value="manual">
              {t("screening.candidateStep.pasteTab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="auto" className="space-y-2 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("screening.candidateStep.uploadHint", { maxMb })}
            </p>
            <FileDropzone
              accept=".pdf,.doc,.docx,.md,.markdown,.txt"
              file={form.cvFile}
              onFileChange={(nextFile) => updateForm("cvFile", nextFile)}
              description={t("screening.candidateStep.dropzoneDescription")}
              aria-invalid={Boolean(errors.cv)}
            />
            {errors.cv ? (
              <p className="text-sm text-destructive">{errors.cv}</p>
            ) : null}
          </TabsContent>
          <TabsContent value="manual" className="space-y-2 pt-2">
            <textarea
              value={form.cvText}
              onChange={(event) => updateForm("cvText", event.target.value)}
              maxLength={SCREENING_LIMITS.cv_text_max_characters}
              rows={8}
              className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder={t("screening.candidateStep.cvPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("screening.candidateStep.characterCount", {
                current: form.cvText.length.toLocaleString(),
                max: SCREENING_LIMITS.cv_text_max_characters.toLocaleString(),
                words: cvTextWords.toLocaleString(),
                maxWords: SCREENING_LIMITS.cv_text_max_words.toLocaleString(),
              })}
            </p>
            {errors.cv_text ? (
              <p className="text-sm text-destructive">{errors.cv_text}</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
