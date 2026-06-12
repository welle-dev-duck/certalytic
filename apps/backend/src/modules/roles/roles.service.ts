import { and, desc, eq, ilike, lt } from 'drizzle-orm';

import type { Database } from '../../db/index';
import { roleDocuments, roles } from '../../db/schema/roles.schema';
import { AppError, NotFoundError } from '../../lib/errors';
import { paginateByCursor } from '../../lib/pagination';
import { generateId } from '../../lib/id';
import type { StorageClient } from '../../storage/storage.client';
import { roleDocumentPath } from '../../storage/storage.paths';
import type { PlanFeaturesService } from '../billing/plans';
import type { RolesProducer } from './roles.producer';
import type {
  CreateRoleBodyDto,
  RoleDetailDto,
  RoleListItemDto,
  RoleListQueryDto,
  UpdateRoleBodyDto,
  UploadedRoleDocumentFile,
} from './roles.dto';

export class RolesService {
  constructor(
    private readonly db: Database,
    private readonly planFeatures: PlanFeaturesService,
    private readonly storage: StorageClient,
    private readonly rolesProducer: RolesProducer,
  ) {}

  async list(
    organizationId: string,
    query: RoleListQueryDto,
  ): Promise<{
    data: RoleListItemDto[];
    pagination: ReturnType<typeof paginateByCursor<RoleListItemDto>>['pagination'];
  }> {
    await this.assertSavedRoles(organizationId);

    const filters = [eq(roles.organizationId, organizationId)];

    if (query.cursor) {
      filters.push(lt(roles.id, query.cursor));
    }

    if (query.search) {
      filters.push(ilike(roles.title, `%${query.search}%`));
    }

    const rows = await this.db
      .select({
        id: roles.id,
        title: roles.title,
        description: roles.description,
        contextMetadata: roles.contextMetadata,
        createdAt: roles.createdAt,
      })
      .from(roles)
      .where(and(...filters))
      .orderBy(desc(roles.id))
      .limit(query.limit + 1);

    const items: RoleListItemDto[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      contextMetadata: row.contextMetadata ?? null,
      candidatesCount: 0,
      avgIntegrity: null,
      createdAt: row.createdAt,
    }));

    return paginateByCursor(items, query.limit);
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

    return {
      id: role.id,
      title: role.title,
      description: role.description,
      contextMetadata: role.contextMetadata ?? null,
      candidatesCount: 0,
      avgIntegrity: null,
      createdAt: role.createdAt,
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
