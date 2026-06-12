import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors';

export const ADMIN_ROLE = 'admin';

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.session?.user) {
    next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
    return;
  }

  if (req.session.user.role !== ADMIN_ROLE) {
    next(new AppError('Forbidden', 403, 'FORBIDDEN'));
    return;
  }

  next();
}
