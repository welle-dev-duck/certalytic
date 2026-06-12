import { Router, type IRouter, type RequestHandler } from 'express';

import { requireAuth } from '../../middleware/require-auth';
import { requireOrgOwner } from '../../middleware/require-org-role';
import { validate } from '../../lib/validate';
import {
  packCheckoutBodySchema,
  packConfirmBodySchema,
} from './billing.dto';
import type { BillingController } from './billing.controller';

export class BillingRouter {
  readonly router: IRouter;

  constructor(
    billingController: BillingController,
    requireOrganization: RequestHandler,
  ) {
    this.router = Router();
    const withOrganization = [requireAuth, requireOrganization];

    this.router.get('/usage', ...withOrganization, billingController.usage);

    this.router.post(
      '/packs/checkout',
      ...withOrganization,
      requireOrgOwner,
      validate({ body: packCheckoutBodySchema }),
      billingController.createPackCheckout,
    );

    this.router.post(
      '/packs/confirm',
      ...withOrganization,
      requireOrgOwner,
      validate({ body: packConfirmBodySchema }),
      billingController.confirmPackCheckout,
    );
  }
}
