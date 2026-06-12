import { Router, type IRouter, type RequestHandler } from 'express';

import { requireAuth } from '../../middleware/require-auth';
import type { OrganizationsController } from './organizations.controller';

export class OrganizationsRouter {
  readonly router: IRouter;

  constructor(
    organizationsController: OrganizationsController,
    requireOrganization: RequestHandler,
  ) {
    this.router = Router();

    this.router.get(
      '/active',
      requireAuth,
      requireOrganization,
      organizationsController.getActive,
    );
  }
}
