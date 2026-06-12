import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
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
