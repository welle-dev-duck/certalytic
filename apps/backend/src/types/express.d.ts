import type { AuthSession } from '../modules/auth/auth.types';

declare global {
  namespace Express {
    interface Request {
      session: AuthSession | null;
    }
  }
}

export {};
