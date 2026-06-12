import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { transcriptLimits } from '../config/env';
import { AppError } from '../lib/errors';
import {
  CANDIDATE_CREATE_UPLOAD_MAX_BYTES,
} from '../modules/candidates/candidates-create.constants';
import { parseCandidateCreateRequest } from '../modules/candidates/candidates-create.parser';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CANDIDATE_CREATE_UPLOAD_MAX_BYTES },
});

function mapMulterError(error: multer.MulterError): AppError {
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError(
      `Unexpected upload field "${error.field}". Use "cv" and "transcript_files" for file uploads.`,
      400,
      'VALIDATION_ERROR',
    );
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return new AppError(
      'Uploaded file exceeds the maximum allowed size.',
      400,
      'VALIDATION_ERROR',
    );
  }

  return new AppError(error.message, 400, 'VALIDATION_ERROR');
}

export function uploadCandidateCreate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const log = req.log;

  upload.fields([
    { name: 'cv', maxCount: 1 },
    {
      name: 'transcript_files',
      maxCount: transcriptLimits.maxTranscriptFiles,
    },
  ])(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      log.warn(
        { err: error, code: error.code, field: error.field },
        'Candidate create upload rejected by multer',
      );
      next(mapMulterError(error));
      return;
    }

    if (error) {
      log.error({ err: error }, 'Candidate create upload failed');
      next(error);
      return;
    }

    log.debug(
      {
        cvFiles: (req.files as { cv?: unknown[] } | undefined)?.cv?.length ?? 0,
        transcriptFiles:
          (req.files as { transcript_files?: unknown[] } | undefined)
            ?.transcript_files?.length ?? 0,
        transcriptInputMode: req.body?.transcript_input_mode,
        cvInputMode: req.body?.cv_input_mode,
      },
      'Parsing candidate create multipart payload',
    );

    void parseCandidateCreateRequest(req)
      .then((input) => {
        req.createCandidateInput = input;
        log.debug(
          {
            roleId: input.role_id,
            cvInputMode: input.cvFile ? 'auto' : input.cvText ? 'manual' : null,
            transcriptLength: input.transcriptText.length,
          },
          'Candidate create payload parsed',
        );
        next();
      })
      .catch((parseError) => {
        log.warn({ err: parseError }, 'Candidate create payload parse failed');
        next(parseError);
      });
  });
}
