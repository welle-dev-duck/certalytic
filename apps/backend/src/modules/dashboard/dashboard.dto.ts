import { z } from 'zod';

export const dashboardStatsResponseSchema = z.object({
  totalRoles: z.number().int().nonnegative(),
  totalCandidates: z.number().int().nonnegative(),
  highRiskFlagged: z.number().int().nonnegative(),
  mediumRiskFlagged: z.number().int().nonnegative(),
  avgIntegrityScore: z.number().int().min(0).max(100).nullable(),
});

export type DashboardStatsResponseDto = z.infer<
  typeof dashboardStatsResponseSchema
>;
