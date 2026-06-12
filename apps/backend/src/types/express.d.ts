import type { Logger } from 'pino';

import type { AuthSession } from '../modules/auth/auth.types';
import type { CreateCandidateInput } from '../modules/candidates/candidates-create.parser';
import type { OrganizationContext } from './organization';

declare global {
  namespace Express {
    interface Request {
      id: string;
      log: Logger;
      session: AuthSession | null;
      organization?: OrganizationContext;
      createCandidateInput?: CreateCandidateInput;
    }
  }
}

export {};
