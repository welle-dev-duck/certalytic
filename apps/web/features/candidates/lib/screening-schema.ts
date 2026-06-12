import { z } from "zod";

import { MAX_TRANSCRIPT_FILES, type ScreeningLimits } from "./screening-limits";

const githubUrlPattern =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?\/?(?:\?.*)?$/i;

export function createScreeningSchema(limits: ScreeningLimits) {
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "Candidate name is required.")
        .max(
          limits.name_max_characters,
          `Name must not exceed ${limits.name_max_characters.toLocaleString()} characters.`,
        ),
      email: z
        .string()
        .trim()
        .email("Enter a valid email address.")
        .max(
          limits.email_max_characters,
          `Email must not exceed ${limits.email_max_characters.toLocaleString()} characters.`,
        )
        .optional()
        .or(z.literal("")),
      roleId: z.string().uuid("Select a role.").nullable(),
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
          message: "Select a role.",
          path: ["roleId"],
        });
      }

      if (data.cvInputMode === "auto" && data.cvFile === null) {
        ctx.addIssue({
          code: "custom",
          message: "Upload a CV file or switch to manual text input.",
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
          message: `CV file must not exceed ${Math.round(limits.cv_max_kilobytes / 1024)} MB.`,
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
            message: "Paste at least 50 characters of CV content.",
            path: ["cv_text"],
          });
        }

        if (data.cvText.length > limits.cv_text_max_characters) {
          ctx.addIssue({
            code: "custom",
            message: `CV text must not exceed ${limits.cv_text_max_characters.toLocaleString()} characters.`,
            path: ["cv_text"],
          });
        }

        if (wordCount > limits.cv_text_max_words) {
          ctx.addIssue({
            code: "custom",
            message: `CV text exceeds the maximum of ${limits.cv_text_max_words.toLocaleString()} words.`,
            path: ["cv_text"],
          });
        }
      }

      if (data.linkedinText.length > limits.linkedin_text_max_characters) {
        ctx.addIssue({
          code: "custom",
          message: `LinkedIn content must not exceed ${limits.linkedin_text_max_characters.toLocaleString()} characters.`,
          path: ["linkedin_text"],
        });
      }

      if (data.githubUrl.length > limits.github_url_max_characters) {
        ctx.addIssue({
          code: "custom",
          message: `GitHub URL must not exceed ${limits.github_url_max_characters.toLocaleString()} characters.`,
          path: ["github_url"],
        });
      }

      if (data.githubUrl && !githubUrlPattern.test(data.githubUrl)) {
        ctx.addIssue({
          code: "custom",
          message:
            "Enter a valid GitHub profile URL (e.g. https://github.com/username).",
          path: ["github_url"],
        });
      }

      if (
        data.interviewerNotes.length > limits.interviewer_notes_max_characters
      ) {
        ctx.addIssue({
          code: "custom",
          message: `Internal notes must not exceed ${limits.interviewer_notes_max_characters.toLocaleString()} characters.`,
          path: ["interviewer_notes.0"],
        });
      }

      if (data.transcriptInputMode === "manual") {
        const transcript = data.mergedTranscript.trim();

        if (transcript.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "Paste an interview transcript.",
            path: ["transcripts"],
          });
        } else if (transcript.length < 10) {
          ctx.addIssue({
            code: "custom",
            message: "Transcript must be at least 10 characters.",
            path: ["transcripts.0"],
          });
        }

        const wordCount = transcript ? transcript.split(/\s+/).length : 0;

        if (transcript.length > limits.transcript_text_max_characters) {
          ctx.addIssue({
            code: "custom",
            message: `Transcript must not exceed ${limits.transcript_text_max_characters.toLocaleString()} characters.`,
            path: ["transcripts"],
          });
        }

        if (wordCount > limits.transcript_text_max_words) {
          ctx.addIssue({
            code: "custom",
            message: `Transcript exceeds the maximum of ${limits.transcript_text_max_words.toLocaleString()} words.`,
            path: ["transcripts"],
          });
        }
      }

      if (data.transcriptInputMode === "auto") {
        if (data.transcriptFiles.length === 0) {
          ctx.addIssue({
            code: "custom",
            message:
              "Upload at least one Zoom .vtt or Teams .docx transcript file.",
            path: ["transcript_files"],
          });
        }

        if (data.transcriptFiles.length > MAX_TRANSCRIPT_FILES) {
          ctx.addIssue({
            code: "custom",
            message: `You can upload up to ${MAX_TRANSCRIPT_FILES} transcript files.`,
            path: ["transcript_files"],
          });
        }

        for (const [index, file] of data.transcriptFiles.entries()) {
          const extension = file.name.split(".").pop()?.toLowerCase();
          if (!extension || !["vtt", "docx"].includes(extension)) {
            ctx.addIssue({
              code: "custom",
              message:
                "Upload a Zoom .vtt caption file or a Teams .docx export.",
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

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed.";
}
