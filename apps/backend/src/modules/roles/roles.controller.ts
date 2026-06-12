import type { Request, Response } from 'express';

import { AppError } from '../../lib/errors';
import { sendJson } from '../../lib/response';
import { getValidatedBody, getValidatedParams, getValidatedQuery } from '../../lib/validated-request';
import {
  roleDetailSchema,
  roleExportSummarySchema,
  roleListResponseSchema,
  type CreateRoleBodyDto,
  type RoleListQueryDto,
  type UpdateRoleBodyDto,
} from './roles.dto';
import type { RolesExportService } from './roles-export.service';
import type { RolesService } from './roles.service';

export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly rolesExportService: RolesExportService,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.rolesService.list(
      req.organization!.id,
      getValidatedQuery<RoleListQueryDto>(req),
    );

    sendJson(res, roleListResponseSchema, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const role = await this.rolesService.getById(req.organization!.id, id);

    sendJson(res, roleDetailSchema, role);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const role = await this.rolesService.create(
      req.organization!.id,
      getValidatedBody<CreateRoleBodyDto>(req),
    );

    sendJson(res, roleDetailSchema, role, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = getValidatedParams<{ id: string }>(req);
    const role = await this.rolesService.update(
      req.organization!.id,
      id,
      getValidatedBody<UpdateRoleBodyDto>(req),
    );

    sendJson(res, roleDetailSchema, role);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await this.rolesService.delete(req.organization!.id, id);

    res.status(204).send();
  };

  uploadDocument = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      throw new AppError('Document is required', 400, 'VALIDATION_ERROR');
    }

    const { id } = req.params as { id: string };
    const role = await this.rolesService.uploadDocument(
      req.organization!.id,
      id,
      req.file,
    );

    sendJson(res, roleDetailSchema, role, 201);
  };

  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    const { id, documentId } = req.params as {
      id: string;
      documentId: string;
    };
    const role = await this.rolesService.deleteDocument(
      req.organization!.id,
      id,
      documentId,
    );

    sendJson(res, roleDetailSchema, role);
  };

  requestExport = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const exportSummary = await this.rolesExportService.requestExport(
      req.organization!.id,
      id,
      req.session!.user.id,
    );

    sendJson(res, roleExportSummarySchema, exportSummary, 202);
  };

  getLatestExport = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const latest = await this.rolesExportService.getLatestExport(
      req.organization!.id,
      id,
    );

    if (!latest) {
      res.status(204).send();
      return;
    }

    sendJson(res, roleExportSummarySchema, latest);
  };

  downloadExport = async (req: Request, res: Response): Promise<void> => {
    const { id, exportId } = req.params as { id: string; exportId: string };
    const download = await this.rolesExportService.getDownload(
      req.organization!.id,
      id,
      exportId,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.filename}"`,
    );
    res.send(download.buffer);
  };
}
