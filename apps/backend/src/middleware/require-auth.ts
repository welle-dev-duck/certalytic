import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors';

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.session?.user) {
    next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    return;
  }

  next();
}
