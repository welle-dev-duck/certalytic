import { and, desc, eq, inArray } from 'drizzle-orm';

import type { Database } from '../../db/index';
import {
  roleExports,
  roles,
  type RoleExportStatus,
} from '../../db/schema/roles.schema';
import { AppError, NotFoundError } from '../../lib/errors';
import { generateId } from '../../lib/id';
import type { StorageClient } from '../../storage/storage.client';
import type { PlanFeaturesService } from '../billing/plans';
import type { CandidateReportService } from '../candidates/candidate-report.service';
import { RoleExportPdfGenerator } from '../exports/role-export-pdf.generator';
import {
  NoopRealtimePublisher,
  type RealtimePublisher,
} from '../../realtime/publisher';
import type { RoleExportsProducer } from './role-exports.producer';

export type RoleExportSummary = {
  id: string;
  status: RoleExportStatus;
  errorMessage: string | null;
  completedAt: Date | null;
  downloadUrl: string | null;
};

export class RolesExportService {
  private readonly generator: RoleExportPdfGenerator;

  constructor(
    private readonly db: Database,
    private readonly storage: StorageClient,
    private readonly planFeatures: PlanFeaturesService,
    private readonly roleExportsProducer: RoleExportsProducer,
    private readonly realtimePublisher: RealtimePublisher = new NoopRealtimePublisher(),
    candidateReportService: CandidateReportService,
  ) {
    this.generator = new RoleExportPdfGenerator(
      db,
      storage,
      planFeatures,
      candidateReportService,
    );
  }

  async requestExport(
    organizationId: string,
    roleId: string,
    userId: string,
  ): Promise<RoleExportSummary> {
    const role = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const inProgress = await this.db.query.roleExports.findFirst({
      where: and(
        eq(roleExports.roleId, roleId),
        inArray(roleExports.status, ['pending', 'processing']),
      ),
    });

    if (inProgress) {
      throw new AppError(
        'A role dossier export is already in progress.',
        409,
        'EXPORT_IN_PROGRESS',
      );
    }

    const exportId = generateId();

    await this.db.insert(roleExports).values({
      id: exportId,
      organizationId,
      roleId,
      userId,
      status: 'pending',
    });

    const usePriority = await this.planFeatures.can(
      organizationId,
      'priority_queue',
    );

    await this.roleExportsProducer.enqueueGenerateExport(
      { roleExportId: exportId },
      usePriority ? { priority: 1 } : undefined,
    );

    await this.publishExportUpdate({
      id: exportId,
      organizationId,
      roleId,
      status: 'pending',
      errorMessage: null,
      path: null,
    });

    return {
      id: exportId,
      status: 'pending',
      errorMessage: null,
      completedAt: null,
      downloadUrl: null,
    };
  }

  async getLatestExport(
    organizationId: string,
    roleId: string,
  ): Promise<RoleExportSummary | null> {
    const role = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const latest = await this.db.query.roleExports.findFirst({
      where: eq(roleExports.roleId, roleId),
      orderBy: desc(roleExports.createdAt),
    });

    if (!latest) {
      return null;
    }

    return this.toSummary(latest);
  }

  async getDownload(
    organizationId: string,
    roleId: string,
    exportId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const exportRecord = await this.db.query.roleExports.findFirst({
      where: and(
        eq(roleExports.id, exportId),
        eq(roleExports.roleId, roleId),
        eq(roleExports.organizationId, organizationId),
      ),
    });

    if (!exportRecord) {
      throw new NotFoundError('Export not found');
    }

    if (exportRecord.status !== 'complete' || !exportRecord.path) {
      throw new AppError('Export is not ready for download.', 422, 'EXPORT_NOT_READY');
    }

    const buffer = await this.storage.getObject(exportRecord.path);

    if (!buffer) {
      throw new NotFoundError('Export file not found');
    }

    const role = await this.db.query.roles.findFirst({
      where: eq(roles.id, roleId),
      columns: { title: true },
    });

    const safeTitle = (role?.title ?? 'role')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      buffer,
      filename: `${safeTitle || 'role'}-dossier.pdf`,
    };
  }

  async process(roleExportId: string): Promise<void> {
    const exportRecord = await this.db.query.roleExports.findFirst({
      where: eq(roleExports.id, roleExportId),
    });

    if (!exportRecord) {
      return;
    }

    await this.db
      .update(roleExports)
      .set({ status: 'processing' })
      .where(eq(roleExports.id, roleExportId));

    await this.publishExportUpdate({
      id: exportRecord.id,
      organizationId: exportRecord.organizationId,
      roleId: exportRecord.roleId,
      status: 'processing',
      errorMessage: null,
      path: null,
    });

    try {
      const path = await this.generator.store({
        id: exportRecord.id,
        organizationId: exportRecord.organizationId,
        roleId: exportRecord.roleId,
        status: exportRecord.status as RoleExportStatus,
      });

      await this.db
        .update(roleExports)
        .set({
          status: 'complete',
          path,
          errorMessage: null,
          completedAt: new Date(),
        })
        .where(eq(roleExports.id, roleExportId));

      await this.publishExportUpdate({
        id: exportRecord.id,
        organizationId: exportRecord.organizationId,
        roleId: exportRecord.roleId,
        status: 'complete',
        errorMessage: null,
        path,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Role export failed';

      await this.db
        .update(roleExports)
        .set({
          status: 'failed',
          errorMessage: message,
        })
        .where(eq(roleExports.id, roleExportId));

      await this.publishExportUpdate({
        id: exportRecord.id,
        organizationId: exportRecord.organizationId,
        roleId: exportRecord.roleId,
        status: 'failed',
        errorMessage: message,
        path: null,
      });

      throw error;
    }
  }

  private async publishExportUpdate(exportRecord: {
    id: string;
    organizationId: string;
    roleId: string;
    status: string;
    errorMessage: string | null;
    path: string | null;
  }): Promise<void> {
    const downloadUrl =
      exportRecord.status === 'complete'
        ? `/api/roles/${exportRecord.roleId}/exports/${exportRecord.id}/download`
        : null;

    await this.realtimePublisher.roleExportUpdated({
      roleExportId: exportRecord.id,
      roleId: exportRecord.roleId,
      organizationId: exportRecord.organizationId,
      status: exportRecord.status,
      downloadUrl,
      errorMessage: exportRecord.errorMessage,
    });
  }

  private async toSummary(exportRecord: {
    id: string;
    status: string;
    errorMessage: string | null;
    completedAt: Date | null;
    roleId: string;
    organizationId: string;
    path: string | null;
  }): Promise<RoleExportSummary> {
    let downloadUrl: string | null = null;

    if (exportRecord.status === 'complete') {
      downloadUrl = `/api/roles/${exportRecord.roleId}/exports/${exportRecord.id}/download`;
    }

    return {
      id: exportRecord.id,
      status: exportRecord.status as RoleExportStatus,
      errorMessage: exportRecord.errorMessage,
      completedAt: exportRecord.completedAt,
      downloadUrl,
    };
  }
}
