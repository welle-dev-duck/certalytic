import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization, user } from './auth.schema';

export const ROLE_EXPORT_STATUSES = [
  'pending',
  'processing',
  'complete',
  'failed',
] as const;

export type RoleExportStatus = (typeof ROLE_EXPORT_STATUSES)[number];

export const ROLE_DOCUMENT_STATUSES = [
  'pending',
  'processing',
  'complete',
  'failed',
] as const;

export type RoleDocumentStatus = (typeof ROLE_DOCUMENT_STATUSES)[number];

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    contextMetadata: jsonb('context_metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('roles_organizationId_idx').on(table.organizationId),
    index('roles_organizationId_title_idx').on(
      table.organizationId,
      table.title,
    ),
  ],
);

export const roleDocuments = pgTable(
  'role_documents',
  {
    id: uuid('id').primaryKey(),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    originalName: text('original_name').notNull(),
    path: text('path').notNull(),
    extractedText: text('extracted_text'),
    ocrStatus: text('ocr_status').notNull().default('pending'),
    sortOrder: smallint('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('role_documents_roleId_idx').on(table.roleId)],
);

export const roleExports = pgTable(
  'role_exports',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('pending'),
    path: text('path'),
    errorMessage: text('error_message'),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('role_exports_roleId_status_idx').on(table.roleId, table.status)],
);

export const rolesRelations = relations(roles, ({ one, many }) => ({
  organization: one(organization, {
    fields: [roles.organizationId],
    references: [organization.id],
  }),
  documents: many(roleDocuments),
  exports: many(roleExports),
}));

export const roleDocumentsRelations = relations(roleDocuments, ({ one }) => ({
  role: one(roles, {
    fields: [roleDocuments.roleId],
    references: [roles.id],
  }),
}));

export const roleExportsRelations = relations(roleExports, ({ one }) => ({
  role: one(roles, {
    fields: [roleExports.roleId],
    references: [roles.id],
  }),
  organization: one(organization, {
    fields: [roleExports.organizationId],
    references: [organization.id],
  }),
  requestedBy: one(user, {
    fields: [roleExports.userId],
    references: [user.id],
  }),
}));
