import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { apiErrorSchema } from '../dtos/common.dto';
import { AppError, ValidationError } from '../lib/errors';
import { sendJson } from '../lib/response';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ValidationError) {
    sendJson(res, apiErrorSchema, {
      error: {
        message: err.message,
        code: err.code,
        issues: err.issues.flatten(),
      },
    }, 400);
    return;
  }

  if (err instanceof ZodError) {
    sendJson(res, apiErrorSchema, {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        issues: err.flatten(),
      },
    }, 400);
    return;
  }

  if (err instanceof AppError) {
    sendJson(res, apiErrorSchema, {
      error: {
        message: err.message,
        code: err.code,
      },
    }, err.statusCode);
    return;
  }

  console.error(err);
  sendJson(res, apiErrorSchema, {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  }, 500);
}
