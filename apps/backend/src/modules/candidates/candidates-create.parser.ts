import type { Request } from 'express';
import { z } from 'zod';

import { productConfig } from '../../config/product';
import type { CvFormat } from '../../db/schema/candidates.schema';
import { AppError } from '../../lib/errors';
import { limitCvText, limitTranscriptText } from '../../lib/text-content-limiter';
import {
  ALLOWED_CV_EXTENSIONS,
  ALLOWED_TRANSCRIPT_FILE_EXTENSIONS,
  CV_UPLOAD_MAX_BYTES,
  TRANSCRIPT_FILE_MAX_BYTES,
} from './candidates-create.constants';
import { CaptionFileParser } from './caption-file-parser';
import { TranscriptMerger } from './transcript-merger';

const captionFileParser = new CaptionFileParser();
const transcriptMerger = new TranscriptMerger();

const candidateCreateFormSchema = z.object({
  name: z.string().trim().min(1).max(productConfig.limits.nameMaxCharacters),
  email: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : value),
    z
      .string()
      .trim()
      .email()
      .max(productConfig.limits.emailMaxCharacters)
      .optional(),
  ),
  role_id: z.uuid(),
  cv_input_mode: z.enum(['auto', 'manual']),
  cv_text: z.string().optional(),
  transcript_input_mode: z.enum(['manual', 'auto']),
  linkedin_text: z.string().optional(),
  linkedin_url: z.string().optional(),
  github_url: z.string().optional(),
});

export type CreateCandidateInput = {
  name: string;
  email: string | null;
  role_id: string;
  cvText: string | null;
  cvFile: Express.Multer.File | null;
  cvFormat: CvFormat | null;
  transcriptText: string;
  interviewerNotes: string | null;
  linkedinUrl: string | null;
  linkedinText: string | null;
  githubUsername: string | null;
};

type CandidateCreateFiles = {
  cv?: Express.Multer.File[];
  transcript_files?: Express.Multer.File[];
};

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

function getIndexedFormValue(
  body: Record<string, unknown>,
  field: string,
  index: number,
): string | undefined {
  const nested = body[field];

  if (Array.isArray(nested) && typeof nested[index] === 'string') {
    return nested[index];
  }

  if (nested && typeof nested === 'object') {
    const value = (nested as Record<string, unknown>)[String(index)];

    if (typeof value === 'string') {
      return value;
    }
  }

  const bracketKey = `${field}[${index}]`;

  if (typeof body[bracketKey] === 'string') {
    return body[bracketKey];
  }

  return undefined;
}

function normalizeOptionalText(value: string | undefined): string | null {
  if (!value || value.trim() === '') {
    return null;
  }

  return value.trim();
}

export function parseGithubUsername(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  const match = url.trim().match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?)\/?(?:\?.*)?$/iu,
  );

  return match?.[1] ?? null;
}

function resolveCvFormat(extension: string): CvFormat {
  switch (extension.toLowerCase()) {
    case 'pdf':
      return 'pdf';
    case 'doc':
    case 'docx':
      return 'docx';
    case 'md':
    case 'markdown':
    case 'txt':
      return 'markdown';
    default:
      return 'markdown';
  }
}

function assertFileExtension(
  file: Express.Multer.File,
  allowed: Set<string>,
  message: string,
): void {
  const extension = getExtension(file.originalname);

  if (!allowed.has(extension)) {
    throw new AppError(message, 400, 'VALIDATION_ERROR');
  }
}

async function parseTranscriptFiles(
  files: Express.Multer.File[],
): Promise<string> {
  const segments = await Promise.all(files.map(async (file) => {
    assertFileExtension(
      file,
      ALLOWED_TRANSCRIPT_FILE_EXTENSIONS,
      'Upload a Zoom .vtt caption file or a Teams .docx export.',
    );

    if (file.size > TRANSCRIPT_FILE_MAX_BYTES) {
      throw new AppError(
        `Transcript file exceeds the maximum size of ${productConfig.limits.transcriptFileMaxKilobytes} KB.`,
        400,
        'VALIDATION_ERROR',
      );
    }

    try {
      return await captionFileParser.parseContents(
        file.buffer,
        getExtension(file.originalname),
      );
    } catch {
      throw new AppError(
        'One or more transcript files could not be read.',
        400,
        'VALIDATION_ERROR',
      );
    }
  }));

  const merged = transcriptMerger.merge(segments);
  const limited = limitTranscriptText(merged);

  if (limited.wasTruncated) {
    throw new AppError(
      `Combined transcript exceeds the maximum of ${productConfig.limits.transcriptTextMaxWords.toLocaleString()} words.`,
      400,
      'VALIDATION_ERROR',
    );
  }

  if (merged.trim().length < 10) {
    throw new AppError(
      'Transcript must be at least 10 characters.',
      400,
      'VALIDATION_ERROR',
    );
  }

  return limited.text;
}

export async function parseCandidateCreateRequest(
  req: Request,
): Promise<CreateCandidateInput> {
  const body = req.body as Record<string, unknown>;
  const parsed = candidateCreateFormSchema.safeParse(body);

  if (!parsed.success) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR');
  }

  const data = parsed.data;
  const files = (req.files ?? {}) as CandidateCreateFiles;
  const cvFile = files.cv?.[0] ?? null;
  const transcriptFiles = files.transcript_files ?? [];

  if (body.github_username !== undefined || body.github_text !== undefined) {
    throw new AppError(
      'GitHub cross-check is not available in this MVP.',
      400,
      'VALIDATION_ERROR',
    );
  }

  let cvText: string | null = null;
  let cvFormat: CvFormat | null = null;
  let storedCvFile: Express.Multer.File | null = null;

  if (data.cv_input_mode === 'manual') {
    if (!data.cv_text || data.cv_text.trim().length < 50) {
      throw new AppError(
        'Paste CV content or switch to file upload.',
        400,
        'VALIDATION_ERROR',
      );
    }

    const limited = limitCvText(data.cv_text);

    if (limited.wasTruncated) {
      throw new AppError(
        `CV text exceeds the maximum of ${productConfig.limits.cvTextMaxWords.toLocaleString()} words.`,
        400,
        'VALIDATION_ERROR',
      );
    }

    cvText = limited.text;
    cvFormat = 'text';
  } else {
    if (!cvFile) {
      throw new AppError(
        'Upload a CV file or switch to manual text input.',
        400,
        'VALIDATION_ERROR',
      );
    }

    assertFileExtension(
      cvFile,
      ALLOWED_CV_EXTENSIONS,
      'Unsupported CV file format.',
    );

    if (cvFile.size > CV_UPLOAD_MAX_BYTES) {
      throw new AppError(
        `CV file must not exceed ${Math.floor(productConfig.limits.cvMaxKilobytes / 1024)} MB.`,
        400,
        'VALIDATION_ERROR',
      );
    }

    cvFormat = resolveCvFormat(getExtension(cvFile.originalname));
    storedCvFile = cvFile;
  }

  let transcriptText = '';

  if (data.transcript_input_mode === 'manual') {
    const rawTranscript = getIndexedFormValue(body, 'transcripts', 0);

    if (!rawTranscript || rawTranscript.trim().length < 10) {
      throw new AppError(
        'Paste an interview transcript.',
        400,
        'VALIDATION_ERROR',
      );
    }

    const limited = limitTranscriptText(rawTranscript.trim());

    if (limited.wasTruncated) {
      throw new AppError(
        `Transcript exceeds the maximum of ${productConfig.limits.transcriptTextMaxWords.toLocaleString()} words.`,
        400,
        'VALIDATION_ERROR',
      );
    }

    transcriptText = limited.text;
  } else {
    if (transcriptFiles.length === 0) {
      throw new AppError(
        'Upload at least one transcript file or switch to manual paste.',
        400,
        'VALIDATION_ERROR',
      );
    }

    if (transcriptFiles.length > productConfig.transcript.maxTranscriptFiles) {
      throw new AppError(
        `You can upload up to ${productConfig.transcript.maxTranscriptFiles} transcript files.`,
        400,
        'VALIDATION_ERROR',
      );
    }

    transcriptText = await parseTranscriptFiles(transcriptFiles);
  }

  const interviewerNote = normalizeOptionalText(
    getIndexedFormValue(body, 'interviewer_notes', 0),
  );

  const linkedinUrl = normalizeOptionalText(data.linkedin_url);
  const linkedinText = normalizeOptionalText(data.linkedin_text);
  const githubUrl = normalizeOptionalText(data.github_url);
  const githubUsername = parseGithubUsername(githubUrl);

  if (githubUrl && !githubUsername) {
    throw new AppError(
      'Enter a valid GitHub profile URL (e.g. https://github.com/username).',
      400,
      'VALIDATION_ERROR',
    );
  }

  return {
    name: data.name,
    email: normalizeOptionalText(data.email),
    role_id: data.role_id,
    cvText,
    cvFile: storedCvFile,
    cvFormat,
    transcriptText,
    interviewerNotes: interviewerNote,
    linkedinUrl,
    linkedinText,
    githubUsername,
  };
}
