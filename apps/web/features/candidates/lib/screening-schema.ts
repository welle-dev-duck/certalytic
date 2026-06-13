import { z } from "zod";

import type { Translator } from "@/lib/i18n/translate";

import { MAX_TRANSCRIPT_FILES, type ScreeningLimits } from "./screening-limits";

const githubUrlPattern =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/?(?:\?.*)?$/i;

export function createScreeningSchema(t: Translator, limits: ScreeningLimits) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, t("screening.validation.nameRequired"))
        .max(
          limits.name_max_characters,
          t("screening.validation.nameMaxLength", {
            max: limits.name_max_characters.toLocaleString(),
          }),
        ),
      email: z
        .string()
        .trim()
        .email(t("screening.validation.emailInvalid"))
        .max(
          limits.email_max_characters,
          t("screening.validation.emailMaxLength", {
            max: limits.email_max_characters.toLocaleString(),
          }),
        )
        .optional()
        .or(z.literal("")),
      roleId: z.string().uuid(t("screening.validation.roleRequired")).nullable(),
      cvInputMode: z.enum(["auto", "manual"]),
      cvFile: z.instanceof(File).nullable(),
      cvText: z.string(),
      linkedinText: z.string(),
      githubUrl: z.string().trim(),
      transcriptInputMode: z.enum(["manual", "auto"]),
      mergedTranscript: z.string(),
      transcriptFiles: z.array(z.instanceof(File)),
      interviewerNotes: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.roleId === null) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.roleRequired"),
          path: ["roleId"],
        });
      }

      if (data.cvInputMode === "auto" && data.cvFile === null) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.cvFileRequired"),
          path: ["cv"],
        });
      }

      if (
        data.cvInputMode === "auto" &&
        data.cvFile !== null &&
        data.cvFile.size > limits.cv_max_kilobytes * 1024
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.cvFileMaxSize", {
            maxMb: Math.round(limits.cv_max_kilobytes / 1024),
          }),
          path: ["cv"],
        });
      }

      if (data.cvInputMode === "manual") {
        const wordCount = data.cvText.trim()
          ? data.cvText.trim().split(/\s+/).length
          : 0;

        if (data.cvText.trim().length < 50) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.cvTextMinLength"),
            path: ["cv_text"],
          });
        }

        if (data.cvText.length > limits.cv_text_max_characters) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.cvTextMaxLength", {
              max: limits.cv_text_max_characters.toLocaleString(),
            }),
            path: ["cv_text"],
          });
        }

        if (wordCount > limits.cv_text_max_words) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.cvTextMaxWords", {
              max: limits.cv_text_max_words.toLocaleString(),
            }),
            path: ["cv_text"],
          });
        }
      }

      if (data.linkedinText.length > limits.linkedin_text_max_characters) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.linkedinMaxLength", {
            max: limits.linkedin_text_max_characters.toLocaleString(),
          }),
          path: ["linkedin_text"],
        });
      }

      if (data.githubUrl.length > limits.github_url_max_characters) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.githubMaxLength", {
            max: limits.github_url_max_characters.toLocaleString(),
          }),
          path: ["github_url"],
        });
      }

      if (data.githubUrl && !githubUrlPattern.test(data.githubUrl)) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.githubInvalid"),
          path: ["github_url"],
        });
      }

      if (
        data.interviewerNotes.length > limits.interviewer_notes_max_characters
      ) {
        ctx.addIssue({
          code: "custom",
          message: t("screening.validation.notesMaxLength", {
            max: limits.interviewer_notes_max_characters.toLocaleString(),
          }),
          path: ["interviewer_notes.0"],
        });
      }

      if (data.transcriptInputMode === "manual") {
        const transcript = data.mergedTranscript.trim();

        if (transcript.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptRequired"),
            path: ["transcripts"],
          });
        } else if (transcript.length < 10) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptMinLength"),
            path: ["transcripts.0"],
          });
        }

        const wordCount = transcript ? transcript.split(/\s+/).length : 0;

        if (transcript.length > limits.transcript_text_max_characters) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptMaxLength", {
              max: limits.transcript_text_max_characters.toLocaleString(),
            }),
            path: ["transcripts"],
          });
        }

        if (wordCount > limits.transcript_text_max_words) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptMaxWords", {
              max: limits.transcript_text_max_words.toLocaleString(),
            }),
            path: ["transcripts"],
          });
        }
      }

      if (data.transcriptInputMode === "auto") {
        if (data.transcriptFiles.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptFilesRequired"),
            path: ["transcript_files"],
          });
        }

        if (data.transcriptFiles.length > MAX_TRANSCRIPT_FILES) {
          ctx.addIssue({
            code: "custom",
            message: t("screening.validation.transcriptFilesMax", {
              max: MAX_TRANSCRIPT_FILES,
            }),
            path: ["transcript_files"],
          });
        }

        for (const [index, file] of data.transcriptFiles.entries()) {
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (!extension || !["vtt", "docx"].includes(extension)) {
            ctx.addIssue({
              code: "custom",
              message: t("screening.validation.transcriptFileInvalid"),
              path: [`transcript_files.${index}`],
            });
          }
        }
      }
    });
}

export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function firstZodError(error: z.ZodError, t: Translator): string {
  return error.issues[0]?.message ?? t("screening.validation.failed");
}
