import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../lib/errors';
import type { OrganizationsService } from '../modules/organizations/organizations.service';

export function createRequireOrganization(
  organizationsService: OrganizationsService,
): RequestHandler {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    if (!req.session?.user) {
      next(new AppError('Unauthorized', 401, 'UNAUTHORIZED'));
      return;
    }

    const activeOrganizationId = req.session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      next(
        new AppError(
          'No active organization',
          403,
          'NO_ACTIVE_ORGANIZATION',
        ),
      );
      return;
    }

    const organization = await organizationsService.resolveActiveContext(
      req.session.user.id,
      activeOrganizationId,
    );

    if (!organization) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    req.organization = organization;
    next();
  };
}
