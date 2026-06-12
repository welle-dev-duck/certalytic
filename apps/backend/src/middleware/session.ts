import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, Response } from 'express';

import type { Auth } from '../modules/auth/auth';

export function createSessionMiddleware(auth: Auth) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.session = await auth.instance.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      next();
    } catch (error) {
      next(error);
    }
  };
}
