import { z } from 'zod';

export const processCandidateJobSchema = z.object({
  type: z.literal('process-candidate'),
  candidateId: z.uuid(),
});

export type ProcessCandidateJob = z.infer<typeof processCandidateJobSchema>;

/** @deprecated Use ProcessCandidateJob */
export type ScreeningJob = ProcessCandidateJob;

/** @deprecated Use processCandidateJobSchema */
export const screeningJobSchema = processCandidateJobSchema;

/** @deprecated Use processCandidateJobSchema */
export const screeningQueueJobSchema = processCandidateJobSchema;

/** @deprecated Use ProcessCandidateJob */
export type ScreeningQueueJob = ProcessCandidateJob;
