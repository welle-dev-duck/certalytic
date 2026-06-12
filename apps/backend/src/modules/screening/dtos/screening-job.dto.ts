import { z } from 'zod';

export const screeningJobSchema = z.object({
  type: z.literal('process-candidate'),
  candidateId: z.uuid(),
});

export type ScreeningJob = z.infer<typeof screeningJobSchema>;
