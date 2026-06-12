import type { Response } from 'express';
import type { ZodType } from 'zod';

export function sendJson<TSchema extends ZodType>(
  res: Response,
  schema: TSchema,
  data: unknown,
  statusCode = 200,
) {
  res.status(statusCode).json(schema.parse(data));
}
