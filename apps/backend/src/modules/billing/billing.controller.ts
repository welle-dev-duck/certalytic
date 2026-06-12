import type { Request, Response } from 'express';

import { sendJson } from '../../lib/response';
import {
  billingUsageSchema,
  packCheckoutBodySchema,
  packCheckoutResponseSchema,
  packConfirmBodySchema,
  type PackCheckoutBodyDto,
} from './billing.dto';
import type { BillingService } from './billing.service';

export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  usage = async (req: Request, res: Response): Promise<void> => {
    const summary = await this.billingService.usageSummary(req.organization!.id);

    sendJson(res, billingUsageSchema, summary);
  };

  createPackCheckout = async (req: Request, res: Response): Promise<void> => {
    const { pack } = req.body as PackCheckoutBodyDto;
    const url = await this.billingService.createPackCheckoutSession(
      req.organization!.id,
      pack,
    );

    sendJson(res, packCheckoutResponseSchema, { url });
  };

  confirmPackCheckout = async (req: Request, res: Response): Promise<void> => {
    const { session_id: sessionId } = packConfirmBodySchema.parse(req.body);

    await this.billingService.confirmPackCheckoutSession(
      req.organization!.id,
      sessionId,
    );

    res.status(204).send();
  };
}
