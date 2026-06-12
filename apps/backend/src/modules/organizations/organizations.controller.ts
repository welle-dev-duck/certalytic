import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors';
import { sendJson } from '../../lib/response';
import { activeOrganizationResponseSchema } from './organizations.dto';
import type { OrganizationsService } from './organizations.service';

export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  getActive = async (req: Request, res: Response): Promise<void> => {
    if (!req.organization) {
      throw new AppError('Forbidden', 403, 'FORBIDDEN');
    }

    sendJson(res, activeOrganizationResponseSchema, {
      organization: {
        id: req.organization.id,
        name: req.organization.name,
        slug: req.organization.slug,
      },
      role: req.organization.role,
    });
  };
}
