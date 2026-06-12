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

type InterviewsStepProps = ScreeningStepProps & {
  mergedTranscriptWords: number;
};

export function InterviewsStep({
  form,
  errors,
  updateForm,
  mergedTranscriptWords,
}: InterviewsStepProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Add interview transcripts as pasted text or uploaded files. Multiple
        files are merged into one dossier for analysis.
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
            <TabsTrigger value="manual">Paste text</TabsTrigger>
            <TabsTrigger value="auto">Upload file</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="space-y-2 pt-2">
            <Label htmlFor="merged-transcript">
              <Required>Interview transcript</Required>
            </Label>
            <textarea
              id="merged-transcript"
              value={form.mergedTranscript}
              onChange={(event) =>
                updateForm("mergedTranscript", event.target.value)
              }
              rows={8}
              className="flex min-h-[180px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
              placeholder="Paste transcript from Zoom, Teams, or other sources…"
            />
            <p className="text-xs text-muted-foreground">
              {form.mergedTranscript.length.toLocaleString()} /{" "}
              {SCREENING_LIMITS.transcript_text_max_characters.toLocaleString()}{" "}
              characters · {mergedTranscriptWords.toLocaleString()} /{" "}
              {SCREENING_LIMITS.transcript_text_max_words.toLocaleString()}{" "}
              words max
            </p>
            {errors["transcripts.0"] || errors.transcripts ? (
              <p className="text-sm text-destructive">
                {errors["transcripts.0"] ?? errors.transcripts}
              </p>
            ) : null}
          </TabsContent>
          <TabsContent value="auto" className="space-y-2 pt-2">
            <Label htmlFor="transcript-files">
              <Required>Transcript files</Required>
            </Label>
            <p className="text-sm text-muted-foreground">
              Upload up to {MAX_TRANSCRIPT_FILES} Zoom .vtt captions or Teams
              .docx exports.
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
              description="or click to browse (up to 3 files)"
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
          <Label htmlFor="interviewer-notes">Internal notes</Label>
          <textarea
            id="interviewer-notes"
            value={form.interviewerNotes}
            onChange={(event) =>
              updateForm("interviewerNotes", event.target.value)
            }
            maxLength={SCREENING_LIMITS.interviewer_notes_max_characters}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs"
            placeholder="Private recruiter observations…"
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
