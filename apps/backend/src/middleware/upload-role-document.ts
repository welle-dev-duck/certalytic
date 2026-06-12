import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

import { AppError } from '../lib/errors';
import {
  ALLOWED_ROLE_DOCUMENT_EXTENSIONS,
  ROLE_DOCUMENT_MAX_BYTES,
} from '../modules/roles/roles.dto';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: ROLE_DOCUMENT_MAX_BYTES },
});

function getExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

export function uploadRoleDocument(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  upload.single('document')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      next(new AppError(error.message, 400, 'VALIDATION_ERROR'));
      return;
    }

    if (error) {
      next(error);
      return;
    }

    if (!req.file) {
      next(new AppError('Document is required', 400, 'VALIDATION_ERROR'));
      return;
    }

    const extension = getExtension(req.file.originalname);

    if (!ALLOWED_ROLE_DOCUMENT_EXTENSIONS.has(extension)) {
      next(
        new AppError(
          'Unsupported role document format.',
          400,
          'VALIDATION_ERROR',
        ),
      );
      return;
    }

    next();
  });
}
