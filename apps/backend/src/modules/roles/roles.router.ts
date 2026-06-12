import { Router, type IRouter, type RequestHandler } from 'express';

import { requireAuth } from '../../middleware/require-auth';
import { uploadRoleDocument } from '../../middleware/upload-role-document';
import { validate } from '../../lib/validate';
import {
  createRoleBodySchema,
  roleDocumentParamsSchema,
  roleExportParamsSchema,
  roleIdParamsSchema,
  roleListQuerySchema,
  updateRoleBodySchema,
} from './roles.dto';
import type { RolesController } from './roles.controller';

export class RolesRouter {
  readonly router: IRouter;

  constructor(
    rolesController: RolesController,
    requireOrganization: RequestHandler,
  ) {
    this.router = Router();

    const withOrganization = [requireAuth, requireOrganization];

    this.router.get(
      '/',
      ...withOrganization,
      validate({ query: roleListQuerySchema }),
      rolesController.list,
    );

    this.router.post(
      '/',
      ...withOrganization,
      validate({ body: createRoleBodySchema }),
      rolesController.create,
    );

    this.router.get(
      '/:id',
      ...withOrganization,
      validate({ params: roleIdParamsSchema }),
      rolesController.getById,
    );

    this.router.patch(
      '/:id',
      ...withOrganization,
      validate({ params: roleIdParamsSchema, body: updateRoleBodySchema }),
      rolesController.update,
    );

    this.router.delete(
      '/:id',
      ...withOrganization,
      validate({ params: roleIdParamsSchema }),
      rolesController.delete,
    );

    this.router.post(
      '/:id/documents',
      ...withOrganization,
      validate({ params: roleIdParamsSchema }),
      uploadRoleDocument,
      rolesController.uploadDocument,
    );

    this.router.delete(
      '/:id/documents/:documentId',
      ...withOrganization,
      validate({ params: roleDocumentParamsSchema }),
      rolesController.deleteDocument,
    );

    this.router.post(
      '/:id/export',
      ...withOrganization,
      validate({ params: roleIdParamsSchema }),
      rolesController.requestExport,
    );

    this.router.get(
      '/:id/exports/latest',
      ...withOrganization,
      validate({ params: roleIdParamsSchema }),
      rolesController.getLatestExport,
    );

    this.router.get(
      '/:id/exports/:exportId/download',
      ...withOrganization,
      validate({ params: roleExportParamsSchema }),
      rolesController.downloadExport,
    );
  }
}
