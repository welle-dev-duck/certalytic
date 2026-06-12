import { toNodeHandler } from 'better-auth/node';
import type { RequestHandler } from 'express';

import type { Auth } from './auth';

export class AuthRouter {
  readonly handler: RequestHandler;

  constructor(auth: Auth) {
    this.handler = toNodeHandler(auth.instance);
  }
}
