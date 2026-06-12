import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { apiErrorSchema } from '../dtos/common.dto';
import { AppError, ValidationError } from '../lib/errors';
import { logger } from '../lib/logger';
import { sendJson } from '../lib/response';

function getRequestLogger(req: Request) {
  return req.log ?? logger;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  const log = getRequestLogger(req);

  if (err instanceof ValidationError) {
    log.warn(
      { err, code: err.code, issues: err.issues.flatten() },
      'Request validation failed',
    );
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
    log.warn({ err, issues: err.flatten() }, 'Zod validation failed');
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
    const logMethod =
      err.statusCode >= 500 ? log.error.bind(log) : log.warn.bind(log);
    logMethod(
      { err, code: err.code, statusCode: err.statusCode },
      err.message,
    );
    sendJson(res, apiErrorSchema, {
      error: {
        message: err.message,
        code: err.code,
      },
    }, err.statusCode);
    return;
  }

  log.error({ err }, 'Unhandled request error');
  sendJson(res, apiErrorSchema, {
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
    },
  }, 500);
}
