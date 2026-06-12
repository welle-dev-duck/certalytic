import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';

import { ValidationError } from './errors';

type RequestPart = 'body' | 'query' | 'params';

type RequestSchemas = Partial<Record<RequestPart, ZodType>>;

function parsePart(
  req: Request,
  part: RequestPart,
  schema: ZodType,
): void {
  const result = schema.safeParse(req[part]);
  if (!result.success) {
    throw new ValidationError(result.error);
  }

  Object.assign(req, { [part]: result.data });
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
