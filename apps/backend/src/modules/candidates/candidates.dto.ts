import { z } from 'zod';

import { createPaginatedResponseSchema } from '../../dtos/pagination.dto';
import { CANDIDATE_STATUSES } from '../../db/schema/candidates.schema';
import { productConfig } from '../../config/product';

export const candidateListQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .refine((value) => [10, 25, 50, 100].includes(value))
    .default(25),
  cursor: z.uuid().optional(),
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
    .max(productConfig.limits.nameMaxCharacters)
    .optional(),
  email: z
    .email()
    .max(productConfig.limits.emailMaxCharacters)
    .optional()
    .nullable(),
});

export const candidateIdParamsSchema = z.object({
  id: z.uuid(),
});

export const importCandidatesBodySchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        email: z.email().optional().nullable(),
        transcript: z.string().trim().min(10),
      }),
    )
    .min(1)
    .max(50),
  role_id: z.uuid(),
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
  linkedinUrl: z.string().nullable(),
  githubUsername: z.string().nullable(),
  scoreBreakdown: z.record(z.string(), z.unknown()).nullable(),
  followUpSuggested: z.array(z.string()).nullable(),
  rounds: z.array(interviewRoundSchema),
});

export const candidateListResponseSchema =
  createPaginatedResponseSchema(candidateListItemSchema);

export const candidateReportSchema = z.object({
  score: z.number(),
  level: z.enum(['high', 'medium', 'low']),
  subScores: z.object({
    s_cv: z.number(),
    s_int: z.number(),
    s_cross: z.number().nullable(),
    s_id: z.number(),
  }),
  flags: z.array(
    z.object({
      type: z.string(),
      severity: z.string(),
      description: z.string(),
      confidence: z.number(),
    }),
  ),
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
  behaviourAnalysis: z.record(z.string(), z.unknown()).nullable(),
  personalityAnalysis: z.record(z.string(), z.unknown()).nullable(),
});

export type UpdateCandidateBodyDto = z.infer<typeof updateCandidateBodySchema>;
export type ImportCandidatesBodyDto = z.infer<typeof importCandidatesBodySchema>;
export type CandidateListItemDto = z.infer<typeof candidateListItemSchema>;
export type CandidateDetailDto = z.infer<typeof candidateDetailSchema>;
export type CandidateReportDto = z.infer<typeof candidateReportSchema>;
