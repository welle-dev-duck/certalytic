import { z } from 'zod';

import { roleExportJobSchema } from '../../roles/dtos/role-export-job.dto';

export const processCandidateJobSchema = z.object({
  type: z.literal('process-candidate'),
  candidateId: z.uuid(),
});

export const screeningQueueJobSchema = z.discriminatedUnion('type', [
  processCandidateJobSchema,
  roleExportJobSchema,
]);

export type ProcessCandidateJob = z.infer<typeof processCandidateJobSchema>;
export type ScreeningQueueJob = z.infer<typeof screeningQueueJobSchema>;

/** @deprecated Use ProcessCandidateJob or ScreeningQueueJob */
export type ScreeningJob = ProcessCandidateJob;

/** @deprecated Use screeningQueueJobSchema */
export const screeningJobSchema = processCandidateJobSchema;
