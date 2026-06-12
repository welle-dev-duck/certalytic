import type { Request, Response } from 'express';

import { apiErrorSchema } from '../dtos/common.dto';
import { sendJson } from '../lib/response';

export function notFound(_req: Request, res: Response) {
  sendJson(res, apiErrorSchema, {
    error: {
      message: 'Not found',
      code: 'NOT_FOUND',
    },
  }, 404);
}
