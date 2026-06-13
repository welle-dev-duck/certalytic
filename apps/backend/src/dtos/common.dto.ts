import { z } from 'zod';

export const healthCheckResultSchema = z.object({
  status: z.enum(['ok', 'error']),
  latencyMs: z.number().int().nonnegative(),
  message: z.string().optional(),
});

export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>;

export const healthResponseSchema = z.object({
  status: z.enum(['ok', 'error']),
  checks: z.object({
    database: healthCheckResultSchema,
    redis: healthCheckResultSchema,
  }),
});

export type HealthResponseDto = z.infer<typeof healthResponseSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    issues: z.unknown().optional(),
  }),
});

export type ApiErrorDto = z.infer<typeof apiErrorSchema>;
