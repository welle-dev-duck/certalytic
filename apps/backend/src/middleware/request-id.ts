import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { createRequestLogger } from '../lib/logger';

function readIncomingRequestId(
  value: string | string[] | undefined,
): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (Array.isArray(value) && value[0]?.trim()) {
    return value[0].trim();
  }

  return undefined;
}

export const requestId: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const id = readIncomingRequestId(req.headers['x-request-id']) ?? randomUUID();

  req.id = id;
  req.log = createRequestLogger(id);
  res.setHeader('X-Request-Id', id);

  next();
};
