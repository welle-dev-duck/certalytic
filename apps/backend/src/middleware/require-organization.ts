import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../lib/errors';
import type { AuthService } from '../modules/auth/auth.service';
import type { OrganizationsService } from '../modules/organizations/organizations.service';

export function createRequireOrganization(
  organizationsService: OrganizationsService,
  authService: AuthService,
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

    let activeOrganizationId = req.session.session.activeOrganizationId;

    if (!activeOrganizationId) {
      const defaultOrganizationId = await authService.getDefaultOrganization(
        req.session.user.id,
      );

      if (!defaultOrganizationId) {
        next(
          new AppError(
            'No active organization',
            403,
            'NO_ACTIVE_ORGANIZATION',
          ),
        );
        return;
      }

      await authService.setSessionActiveOrganization(
        req.session.session.id,
        defaultOrganizationId,
      );

      activeOrganizationId = defaultOrganizationId;
      req.session.session.activeOrganizationId = defaultOrganizationId;

      req.log.warn(
        {
          userId: req.session.user.id,
          organizationId: defaultOrganizationId,
        },
        'Session missing active organization; defaulted from membership',
      );
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
