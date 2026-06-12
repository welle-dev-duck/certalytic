import { z } from 'zod';

import { roleDocumentJobSchema } from './role-document-job.dto';
import { roleExportJobSchema } from './role-export-job.dto';

export const rolesQueueJobSchema = z.discriminatedUnion('type', [
  roleDocumentJobSchema,
  roleExportJobSchema,
]);

export type RolesQueueJob = z.infer<typeof rolesQueueJobSchema>;
