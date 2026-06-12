import { z } from 'zod';

import { createPaginatedResponseSchema } from '../../dtos/pagination.dto';
import {
  ROLE_DOCUMENT_STATUSES,
  ROLE_EXPORT_STATUSES,
} from '../../db/schema/roles.schema';
import { productConfig } from '../../config/product';

export const roleListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [10, 25, 50, 100].includes(value))
    .default(25),
  cursor: z.uuid().optional(),
  search: z.string().trim().optional(),
});

export type RoleListQueryDto = z.infer<typeof roleListQuerySchema>;

export const createRoleBodySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1)
    .max(productConfig.limits.roleTitleMaxCharacters),
  description: z
    .string()
    .trim()
    .max(productConfig.limits.roleDescriptionMaxCharacters)
    .optional()
    .nullable(),
});

export const updateRoleBodySchema = createRoleBodySchema;

export type CreateRoleBodyDto = z.infer<typeof createRoleBodySchema>;
export type UpdateRoleBodyDto = z.infer<typeof updateRoleBodySchema>;

export const roleIdParamsSchema = z.object({
  id: z.uuid(),
});

export const roleDocumentParamsSchema = z.object({
  id: z.uuid(),
  documentId: z.uuid(),
});

export const roleExportParamsSchema = z.object({
  id: z.uuid(),
  exportId: z.uuid(),
});

export const roleExportSummarySchema = z.object({
  id: z.uuid(),
  status: z.enum(ROLE_EXPORT_STATUSES),
  errorMessage: z.string().nullable(),
  completedAt: z.coerce.date().nullable(),
  downloadUrl: z.string().nullable(),
});

export const roleListItemSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  contextMetadata: z.record(z.string(), z.unknown()).nullable(),
  candidatesCount: z.number().int().nonnegative(),
  avgIntegrity: z.number().nullable(),
  createdAt: z.coerce.date(),
});

export const roleDocumentSummarySchema = z.object({
  id: z.uuid(),
  originalName: z.string(),
  ocrStatus: z.enum(ROLE_DOCUMENT_STATUSES),
  sortOrder: z.number().int(),
});

export const roleDetailSchema = roleListItemSchema.extend({
  documents: z.array(roleDocumentSummarySchema),
});

export const roleListResponseSchema =
  createPaginatedResponseSchema(roleListItemSchema);

export type RoleListItemDto = z.infer<typeof roleListItemSchema>;
export type RoleDetailDto = z.infer<typeof roleDetailSchema>;
export type RoleExportSummaryDto = z.infer<typeof roleExportSummarySchema>;

export const ALLOWED_ROLE_DOCUMENT_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'md',
  'markdown',
  'txt',
]);

export const ROLE_DOCUMENT_MAX_BYTES = 10 * 1_024 * 1_024;

export type UploadedRoleDocumentFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};
