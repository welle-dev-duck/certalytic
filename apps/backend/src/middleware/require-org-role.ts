import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../lib/errors';
import type { OrgRole } from '../types/organization';
import { ORG_ADMIN_ROLE, ORG_OWNER_ROLE } from '../types/organization';

export function requireOrgRoles(...allowedRoles: OrgRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.organization) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    if (!allowedRoles.includes(req.organization.role)) {
      next(new AppError('Forbidden', 403, 'FORBIDDEN'));
      return;
    }

    next();
  };
}

export const requireOrgAdmin = requireOrgRoles(ORG_OWNER_ROLE, ORG_ADMIN_ROLE);

export const requireOrgOwner = requireOrgRoles(ORG_OWNER_ROLE);
