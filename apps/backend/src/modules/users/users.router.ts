import { Router, type IRouter } from 'express';

import type { UsersController } from './users.controller';

export class UsersRouter {
  readonly router: IRouter;

  constructor(usersController: UsersController) {
    this.router = Router();
    this.router.get('/session', usersController.getSession);
  }
}
