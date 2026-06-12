import { relations } from 'drizzle-orm';
import {
  boolean,
  decimal,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { organization } from './auth.schema';
import { roles } from './roles.schema';

export const CANDIDATE_STATUSES = [
  'pending',
  'processing',
  'complete',
  'failed',
] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CV_FORMATS = ['pdf', 'docx', 'markdown', 'text'] as const;

export type CvFormat = (typeof CV_FORMATS)[number];

export const candidates = pgTable(
  'candidates',
  {
    id: uuid('id').primaryKey(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id').references(() => roles.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    email: text('email'),
    roleTitle: text('role_title'),
    jobDescription: text('job_description'),
    cvPath: text('cv_path'),
    cvText: text('cv_text'),
    cvFormat: text('cv_format'),
    linkedinUrl: text('linkedin_url'),
    githubUsername: text('github_username'),
    linkedinText: text('linkedin_text'),
    githubText: text('github_text'),
    status: text('status').notNull().default('pending'),
    cvAnalysisResults: jsonb('cv_analysis_results').$type<Record<string, unknown>>(),
    integrityScore: decimal('integrity_score', { precision: 5, scale: 2 }),
    scoreBreakdown: jsonb('score_breakdown').$type<Record<string, unknown>>(),
    followUpSuggested: jsonb('follow_up_suggested').$type<string[]>(),
    highInconsistencyWarning: boolean('high_inconsistency_warning')
      .notNull()
      .default(false),
    errorMessage: text('error_message'),
    processedAt: timestamp('processed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('candidates_organizationId_idx').on(table.organizationId),
    index('candidates_organizationId_status_idx').on(
      table.organizationId,
      table.status,
    ),
    index('candidates_roleId_idx').on(table.roleId),
  ],
);

export const interviewRounds = pgTable(
  'interview_rounds',
  {
    id: uuid('id').primaryKey(),
    candidateId: uuid('candidate_id')
      .notNull()
      .references(() => candidates.id, { onDelete: 'cascade' }),
    roundNumber: smallint('round_number').notNull(),
    transcriptText: text('transcript_text').notNull(),
    interviewerNotes: text('interviewer_notes'),
    wasTruncated: boolean('was_truncated').notNull().default(false),
    roundScores: jsonb('round_scores').$type<Record<string, unknown>>(),
    varianceDelta: decimal('variance_delta', { precision: 5, scale: 2 }),
    deepDivePrompts: jsonb('deep_dive_prompts').$type<string[]>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('interview_rounds_candidate_round_uidx').on(
      table.candidateId,
      table.roundNumber,
    ),
    index('interview_rounds_candidateId_idx').on(table.candidateId),
  ],
);

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  organization: one(organization, {
    fields: [candidates.organizationId],
    references: [organization.id],
  }),
  role: one(roles, {
    fields: [candidates.roleId],
    references: [roles.id],
  }),
  interviewRounds: many(interviewRounds),
}));

export const interviewRoundsRelations = relations(interviewRounds, ({ one }) => ({
  candidate: one(candidates, {
    fields: [interviewRounds.candidateId],
    references: [candidates.id],
  }),
}));
