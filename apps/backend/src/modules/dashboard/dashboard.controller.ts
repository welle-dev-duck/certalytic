import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors';
import { sendJson } from '../../lib/response';
import { dashboardStatsResponseSchema } from './dashboard.dto';
import type { DashboardService } from './dashboard.service';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  stats = async (req: Request, res: Response): Promise<void> => {
    if (!req.organization) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    const stats = await this.dashboardService.getStats(req.organization.id);

    sendJson(res, dashboardStatsResponseSchema, stats);
  };
}
