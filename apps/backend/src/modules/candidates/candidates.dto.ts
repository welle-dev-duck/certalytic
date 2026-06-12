import { z } from 'zod';

import { createPaginatedResponseSchema, cursorPaginationQuerySchema } from '../../dtos/pagination.dto';
import { CANDIDATE_STATUSES } from '../../db/schema/candidates.schema';
import { limits } from '../../config/env';

export const candidateListQuerySchema = cursorPaginationQuerySchema.extend({
  search: z.string().trim().optional(),
  role_id: z.uuid().optional(),
  status: z.enum(CANDIDATE_STATUSES).optional(),
});

export type CandidateListQueryDto = z.infer<typeof candidateListQuerySchema>;

export const updateCandidateBodySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(limits.nameMaxCharacters)
    .optional(),
  email: z
    .email()
    .max(limits.emailMaxCharacters)
    .optional()
    .nullable(),
});

export const candidateIdParamsSchema = z.object({
  id: z.uuid(),
});

export const candidateListItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().nullable(),
  roleId: z.uuid().nullable(),
  roleTitle: z.string().nullable(),
  status: z.enum(CANDIDATE_STATUSES),
  integrityScore: z.number().nullable(),
  roundsCount: z.number().int().nonnegative(),
  highInconsistencyWarning: z.boolean(),
  processedAt: z.coerce.date().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export const interviewRoundSchema = z.object({
  id: z.uuid(),
  roundNumber: z.number().int(),
  wasTruncated: z.boolean(),
  varianceDelta: z.number().nullable(),
  deepDivePrompts: z.array(z.string()).nullable(),
  roundScores: z.record(z.string(), z.unknown()).nullable(),
});

export const candidateDetailSchema = candidateListItemSchema.extend({
  jobDescription: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable(),
  githubUsername: z.string().nullable(),
  scoreBreakdown: z.record(z.string(), z.unknown()).nullable(),
  followUpSuggested: z.array(z.string()).nullable(),
  rounds: z.array(interviewRoundSchema),
});

export const candidateListResponseSchema =
  createPaginatedResponseSchema(candidateListItemSchema);

const platformMatrixRowSchema = z.object({
  score: z.number().nullable(),
  explanation: z.string(),
});

const supplementaryAnalysisSchema = z.object({
  summary: z.string(),
  traits: z.array(z.string()),
  detailLabel: z.string(),
  detail: z.string(),
  indicators: z.array(z.string()),
  motivationSignals: z.array(z.string()),
  concerns: z.array(z.string()),
});

const platformAnalysisSchema = z.object({
  provided: z.boolean(),
  handle: z.string().nullable(),
  status: z.enum(['authentic', 'insufficient', 'not_provided']),
  statusLabel: z.string(),
});

export const candidateReportSchema = z.object({
  score: z.number(),
  level: z.enum(['high', 'medium', 'low']),
  subScores: z.object({
    s_cv: z.number(),
    s_int: z.number(),
    s_cross: z.number().nullable(),
    s_id: z.number(),
  }),
  crossSourceEvaluated: z.boolean(),
  componentSummaries: z.object({
    s_cv: z.string(),
    s_int: z.string(),
    s_cross: z.string(),
    s_id: z.string(),
  }),
  componentIndicators: z.object({
    s_cv: z.array(z.string()),
    s_int: z.array(z.string()),
    s_cross: z.array(z.string()),
    s_id: z.array(z.string()),
  }),
  aiTextPercent: z.number(),
  platformConsistency: z.number().nullable(),
  platformMatrix: z.object({
    linkedin_cv_match: platformMatrixRowSchema,
    github_experience_match: platformMatrixRowSchema,
    cross_platform_consistency: platformMatrixRowSchema,
  }),
  interviewVariance: z.number(),
  responseScore: z.number(),
  radar: z.array(z.object({ subject: z.string(), value: z.number() })),
  riskVectors: z.array(z.object({ name: z.string(), value: z.number() })),
  flags: z.array(
    z.object({
      type: z.string(),
      severity: z.string(),
      description: z.string(),
      confidence: z.number(),
    }),
  ),
  linkedin: platformAnalysisSchema,
  github: platformAnalysisSchema,
  verdict: z.object({
    level: z.enum(['high', 'medium', 'low']),
    title: z.string(),
    body: z.string(),
  }),
  recommendedActions: z.array(z.string()),
  rounds: z.array(
    z.object({
      roundNumber: z.number().int(),
      sInt: z.number().nullable(),
      sId: z.number().nullable(),
      varianceDelta: z.number().nullable(),
      wasTruncated: z.boolean(),
      observations: z.array(z.string()),
      deepDivePrompts: z.array(z.string()),
    }),
  ),
  behaviourAnalysis: supplementaryAnalysisSchema,
  personalityAnalysis: supplementaryAnalysisSchema,
});

export type UpdateCandidateBodyDto = z.infer<typeof updateCandidateBodySchema>;
export type CandidateListItemDto = z.infer<typeof candidateListItemSchema>;
export type CandidateDetailDto = z.infer<typeof candidateDetailSchema>;
export type CandidateReportDto = z.infer<typeof candidateReportSchema>;
