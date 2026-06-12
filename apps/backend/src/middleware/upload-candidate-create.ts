import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { AppError } from '../lib/errors';
import {
  CANDIDATE_CREATE_UPLOAD_MAX_BYTES,
} from '../modules/candidates/candidates-create.constants';
import { parseCandidateCreateRequest } from '../modules/candidates/candidates-create.parser';
import { productConfig } from '../config/product';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CANDIDATE_CREATE_UPLOAD_MAX_BYTES },
});

export function uploadCandidateCreate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.fields([
    { name: 'cv', maxCount: 1 },
    {
      name: 'transcript_files',
      maxCount: productConfig.transcript.maxTranscriptFiles,
    },
  ])(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(new AppError(error.message, 400, 'VALIDATION_ERROR'));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    void parseCandidateCreateRequest(req)
      .then((input) => {
        req.createCandidateInput = input;
        next();
      })
      .catch(next);
  });
}
