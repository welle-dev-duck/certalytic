"use client";

import { FileDropzone } from "@/components/file-dropzone";
import { Required } from "@/components/required";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ScreeningStepProps } from "@/features/candidates/components/start-screening/types";
import {
  MAX_TRANSCRIPT_FILES,
  SCREENING_LIMITS,
} from "@/features/candidates/lib/screening-limits";
import { useTranslations } from "@/lib/i18n/client";

type InterviewsStepProps = ScreeningStepProps & {
  mergedTranscriptWords: number;
};

export function InterviewsStep({
  form,
  errors,
  updateForm,
  mergedTranscriptWords,
}: InterviewsStepProps) {
  const t = useTranslations("app");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("screening.interviewsStep.description")}
      </p>

      <div className="space-y-3 border border-border p-4">
        <Tabs
          value={form.transcriptInputMode}
          onValueChange={(value) =>
            updateForm(
              "transcriptInputMode",
              value as ScreeningStepProps["form"]["transcriptInputMode"],
            )
          }
        >
          <TabsList>
            <TabsTrigger value="manual">
              {t("screening.interviewsStep.pasteTab")}
            </TabsTrigger>
            <TabsTrigger value="auto">
              {t("screening.interviewsStep.uploadTab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-2 pt-2">
            <Label htmlFor="merged-transcript">
              <Required>{t("screening.interviewsStep.transcriptLabel")}</Required>
            </Label>
            <textarea
              id="merged-transcript"
              value={form.mergedTranscript}
              onChange={(event) =>
                updateForm("mergedTranscript", event.target.value)
              }
              rows={8}
              className="flex min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder={t("screening.interviewsStep.transcriptPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">
              {t("screening.interviewsStep.characterCount", {
                current: form.mergedTranscript.length.toLocaleString(),
                max: SCREENING_LIMITS.transcript_text_max_characters.toLocaleString(),
                words: mergedTranscriptWords.toLocaleString(),
                maxWords:
                  SCREENING_LIMITS.transcript_text_max_words.toLocaleString(),
              })}
            </p>
            {errors["transcripts.0"] || errors.transcripts ? (
              <p className="text-sm text-destructive">
                {errors["transcripts.0"] ?? errors.transcripts}
              </p>
            ) : null}
          </TabsContent>
          <TabsContent value="auto" className="space-y-2 pt-2">
            <Label htmlFor="transcript-files">
              <Required>{t("screening.interviewsStep.filesLabel")}</Required>
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("screening.interviewsStep.filesHint", {
                max: MAX_TRANSCRIPT_FILES,
              })}
            </p>
            <FileDropzone
              id="transcript-files"
              accept=".vtt,.docx"
              multiple
              files={form.transcriptFiles}
              onFilesChange={(nextFiles) =>
                updateForm(
                  "transcriptFiles",
                  nextFiles.slice(0, MAX_TRANSCRIPT_FILES),
                )
              }
              description={t("screening.interviewsStep.dropzoneDescription")}
              aria-invalid={Boolean(errors.transcript_files)}
            />
            {errors.transcript_files ? (
              <p className="text-sm text-destructive">
                {errors.transcript_files}
              </p>
            ) : null}
          </TabsContent>
        </Tabs>

        <div className="grid gap-2 pt-2">
          <Label htmlFor="interviewer-notes">
            {t("screening.interviewsStep.notesLabel")}
          </Label>
          <textarea
            id="interviewer-notes"
            value={form.interviewerNotes}
            onChange={(event) =>
              updateForm("interviewerNotes", event.target.value)
            }
            maxLength={SCREENING_LIMITS.interviewer_notes_max_characters}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
            placeholder={t("screening.interviewsStep.notesPlaceholder")}
          />
          {errors["interviewer_notes.0"] ? (
            <p className="text-sm text-destructive">
              {errors["interviewer_notes.0"]}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
