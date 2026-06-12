import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

import { ValidationError } from './errors';

type RequestPart = 'body' | 'query' | 'params';

type RequestSchemas = Partial<Record<RequestPart, ZodType>>;

function assignRequestPart(
  req: Request,
  part: RequestPart,
  value: unknown,
): void {
  if (part === 'body') {
    req.body = value;
    return;
  }

  // Express 5 exposes query/params as read-only getters on the prototype.
  // Shadow them on the request instance with the parsed/coerced value.
  Object.defineProperty(req, part, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

function parsePart(
  req: Request,
  part: RequestPart,
  schema: ZodType,
): void {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    throw new ValidationError(result.error);
  }

  assignRequestPart(req, part, result.data);
}

export function validate(schemas: RequestSchemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const [part, schema] of Object.entries(schemas) as [
        RequestPart,
        ZodType,
      ][]) {
        parsePart(req, part, schema);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
