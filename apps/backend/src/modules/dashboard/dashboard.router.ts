import { Router, type IRouter, type RequestHandler } from 'express';

import { requireAuth } from '../../middleware/require-auth';
import type { DashboardController } from './dashboard.controller';

export class DashboardRouter {
  readonly router: IRouter;

  constructor(
    dashboardController: DashboardController,
    requireOrganization: RequestHandler,
  ) {
    this.router = Router();

    this.router.get(
      '/stats',
      requireAuth,
      requireOrganization,
      dashboardController.stats,
    );
  }
}
