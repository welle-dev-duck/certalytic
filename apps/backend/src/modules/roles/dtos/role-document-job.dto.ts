import { z } from 'zod';

export const roleDocumentJobSchema = z.object({
  type: z.literal('process-document'),
  documentId: z.uuid(),
});

export type RoleDocumentJob = z.infer<typeof roleDocumentJobSchema>;
