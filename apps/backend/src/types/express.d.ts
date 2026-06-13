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
      /**
       * Populated by the `validate` middleware. After validation, `query`,
       * `body`, and `params` hold the parsed Zod output - use `getValidatedQuery`
       * and siblings from `lib/validated-request.ts` for typed access.
       */
    }
  }
}

export {};
