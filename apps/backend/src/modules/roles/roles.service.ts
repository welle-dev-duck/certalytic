import {
  and,
  avg,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
} from 'drizzle-orm';

import type { Database } from '../../db/index';
import { candidates } from '../../db/schema/candidates.schema';
import { roleDocuments, roles } from '../../db/schema/roles.schema';
import { AppError, NotFoundError } from '../../lib/errors';
import { paginateByCursor } from '../../lib/pagination';
import { generateId } from '../../lib/id';
import type { StorageClient } from '../../storage/storage.client';
import { roleDocumentPath } from '../../storage/storage.paths';
import type { PlanFeaturesService } from '../billing/plans';
import type { RolesProducer } from './roles.producer';
import type { CandidateSensitiveDataService } from '../candidates/candidate-sensitive-data.service';
import type {
  CreateRoleBodyDto,
  RoleDetailDto,
  RoleListItemDto,
  RoleListQueryDto,
  RoleOptionDto,
  UpdateRoleBodyDto,
  UploadedRoleDocumentFile,
} from './roles.dto';

export class RolesService {
  constructor(
    private readonly db: Database,
    private readonly planFeatures: PlanFeaturesService,
    private readonly storage: StorageClient,
    private readonly rolesProducer: RolesProducer,
    private readonly candidateSensitiveDataService?: CandidateSensitiveDataService,
  ) {}

  async list(
    organizationId: string,
    query: RoleListQueryDto,
  ): Promise<ReturnType<typeof paginateByCursor<RoleListItemDto>>> {
    await this.assertSavedRoles(organizationId);

    const filters = [eq(roles.organizationId, organizationId)];

    if (query.search) {
      filters.push(ilike(roles.title, `%${query.search}%`));
    }

    if (query.cursor) {
      filters.push(lt(roles.id, query.cursor));
    }

    const whereClause = and(...filters);

    const rows = await this.db
      .select({
        id: roles.id,
        title: roles.title,
        description: roles.description,
        contextMetadata: roles.contextMetadata,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(whereClause)
      .orderBy(desc(roles.id))
      .limit(query.limit + 1);

    const roleIds = rows.map((row) => row.id);
    const metricsByRole = await this.loadRoleMetricsBatch(
      organizationId,
      roleIds,
    );

    const items: RoleListItemDto[] = rows.map((row) => {
      const metrics = metricsByRole.get(row.id);

      return {
        id: row.id,
        title: row.title,
        description: row.description,
        contextMetadata: row.contextMetadata ?? null,
        candidatesCount: metrics?.candidatesCount ?? 0,
        avgIntegrity: metrics?.avgIntegrity ?? null,
        createdAt: row.createdAt,
      };
    });

    return paginateByCursor(items, query.limit);
  }

  async listOptions(organizationId: string): Promise<RoleOptionDto[]> {
    await this.assertSavedRoles(organizationId);

    const rows = await this.db
      .select({
        id: roles.id,
        title: roles.title,
      })
      .from(roles)
      .where(eq(roles.organizationId, organizationId))
      .orderBy(desc(roles.id));

    return rows;
  }

  async getById(
    organizationId: string,
    roleId: string,
  ): Promise<RoleDetailDto> {
    await this.assertSavedRoles(organizationId);

    const role = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
      with: {
        documents: {
          orderBy: (documents, { asc }) => [asc(documents.sortOrder)],
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const metrics = await this.loadRoleMetrics(organizationId, roleId);

    return {
      id: role.id,
      title: role.title,
      description: role.description,
      contextMetadata: role.contextMetadata ?? null,
      candidatesCount: metrics.candidatesCount,
      avgIntegrity: metrics.avgIntegrity,
      createdAt: role.createdAt,
      stats: metrics.stats,
      documents: role.documents.map((document) => ({
        id: document.id,
        originalName: document.originalName,
        ocrStatus: document.ocrStatus as RoleDetailDto['documents'][number]['ocrStatus'],
        sortOrder: document.sortOrder,
      })),
    };
  }

  async create(
    organizationId: string,
    input: CreateRoleBodyDto,
  ): Promise<RoleDetailDto> {
    await this.assertSavedRoles(organizationId);

    const id = generateId();

    await this.db.insert(roles).values({
      id,
      organizationId,
      title: input.title,
      description: input.description ?? null,
    });

    return this.getById(organizationId, id);
  }

  async update(
    organizationId: string,
    roleId: string,
    input: UpdateRoleBodyDto,
  ): Promise<RoleDetailDto> {
    await this.assertSavedRoles(organizationId);

    const updated = await this.db
      .update(roles)
      .set({
        title: input.title,
        description: input.description ?? null,
      })
      .where(
        and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
      )
      .returning({ id: roles.id });

    if (updated.length === 0) {
      throw new NotFoundError('Role not found');
    }

    return this.getById(organizationId, roleId);
  }

  async delete(organizationId: string, roleId: string): Promise<void> {
    await this.assertSavedRoles(organizationId);

    const role = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
      with: { documents: true },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (this.candidateSensitiveDataService) {
      await this.candidateSensitiveDataService.deleteCandidatesForRole(
        organizationId,
        roleId,
      );
    }

    await Promise.all(
      role.documents.map((document) => this.storage.deleteObject(document.path)),
    );

    await this.db.delete(roles).where(eq(roles.id, roleId));
  }

  async uploadDocument(
    organizationId: string,
    roleId: string,
    file: UploadedRoleDocumentFile,
  ): Promise<RoleDetailDto> {
    await this.assertRoleContextAssets(organizationId);

    const role = await this.db.query.roles.findFirst({
      where: and(eq(roles.id, roleId), eq(roles.organizationId, organizationId)),
      with: { documents: true },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    const maxDocuments = await this.planFeatures.maxRoleDocuments(organizationId);

    if (role.documents.length >= maxDocuments) {
      throw new AppError(
        `This plan allows a maximum of ${maxDocuments} targeted scan asset(s) per role.`,
        422,
        'ROLE_DOCUMENT_LIMIT_REACHED',
      );
    }

    const extension = file.originalname.split('.').pop()?.toLowerCase() ?? '';
    const path = roleDocumentPath(organizationId, roleId, extension);
    const documentId = generateId();

    await this.storage.putObject(path, file.buffer, file.mimetype);

    await this.db.insert(roleDocuments).values({
      id: documentId,
      roleId,
      originalName: file.originalname,
      path,
      sortOrder: role.documents.length,
    });

    await this.rolesProducer.enqueueProcessDocument({ documentId });

    return this.getById(organizationId, roleId);
  }

  async deleteDocument(
    organizationId: string,
    roleId: string,
    documentId: string,
  ): Promise<RoleDetailDto> {
    await this.assertRoleContextAssets(organizationId);

    const document = await this.db.query.roleDocuments.findFirst({
      where: eq(roleDocuments.id, documentId),
      with: { role: true },
    });

    if (!document || document.roleId !== roleId) {
      throw new NotFoundError('Document not found');
    }

    if (document.role.organizationId !== organizationId) {
      throw new NotFoundError('Document not found');
    }

    await this.storage.deleteObject(document.path);
    await this.db.delete(roleDocuments).where(eq(roleDocuments.id, documentId));

    return this.getById(organizationId, roleId);
  }

  private async loadRoleMetricsBatch(organizationId: string, roleIds: string[]) {
    if (roleIds.length === 0) {
      return new Map<
        string,
        { candidatesCount: number; avgIntegrity: number | null }
      >();
    }

    const rows = await this.db
      .select({
        roleId: candidates.roleId,
        candidatesCount: count(),
        avgIntegrity: avg(candidates.integrityScore),
      })
      .from(candidates)
      .where(
        and(
          eq(candidates.organizationId, organizationId),
          inArray(candidates.roleId, roleIds),
        ),
      )
      .groupBy(candidates.roleId);

    return new Map(
      rows
        .filter((row) => row.roleId !== null)
        .map((row) => [
          row.roleId!,
          {
            candidatesCount: Number(row.candidatesCount),
            avgIntegrity:
              row.avgIntegrity !== null && row.avgIntegrity !== undefined
                ? Math.round(Number(row.avgIntegrity))
                : null,
          },
        ]),
    );
  }

  private async loadRoleMetrics(organizationId: string, roleId: string) {
    const baseWhere = and(
      eq(candidates.roleId, roleId),
      eq(candidates.organizationId, organizationId),
    );

    const [aggregate] = await this.db
      .select({
        candidatesCount: count(),
        avgIntegrity: avg(candidates.integrityScore),
      })
      .from(candidates)
      .where(baseWhere);

    const scoredWhere = and(
      baseWhere,
      eq(candidates.status, 'complete'),
      isNotNull(candidates.integrityScore),
    );

    const [highRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(and(scoredWhere, gte(candidates.integrityScore, '75')));

    const [mediumRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(
        and(
          scoredWhere,
          gte(candidates.integrityScore, '50'),
          lt(candidates.integrityScore, '75'),
        ),
      );

    const [lowRow] = await this.db
      .select({ value: count() })
      .from(candidates)
      .where(and(scoredWhere, lt(candidates.integrityScore, '50')));

    const distribution = {
      high: Number(highRow?.value ?? 0),
      medium: Number(mediumRow?.value ?? 0),
      low: Number(lowRow?.value ?? 0),
    };

    const scored =
      distribution.high + distribution.medium + distribution.low;

    const avgRaw = aggregate?.avgIntegrity;
    const avgIntegrity =
      avgRaw !== null && avgRaw !== undefined
        ? Math.round(Number(avgRaw))
        : null;

    return {
      candidatesCount: Number(aggregate?.candidatesCount ?? 0),
      avgIntegrity,
      stats: {
        avgIntegrity,
        scored,
        distribution,
      },
    };
  }

  private async assertSavedRoles(organizationId: string): Promise<void> {
    const allowed = await this.planFeatures.can(organizationId, 'saved_roles');

    if (!allowed) {
      throw new AppError('Saved roles are not available on this plan.', 403, 'PLAN_FEATURE_REQUIRED');
    }
  }

  private async assertRoleContextAssets(organizationId: string): Promise<void> {
    const allowed = await this.planFeatures.can(
      organizationId,
      'role_context_assets',
    );

    if (!allowed) {
      throw new AppError(
        'Role context assets are not available on this plan.',
        403,
        'PLAN_FEATURE_REQUIRED',
      );
    }
  }
}
