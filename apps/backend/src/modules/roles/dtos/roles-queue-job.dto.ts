import { z } from 'zod';

import { roleDocumentJobSchema } from './role-document-job.dto';

export const rolesQueueJobSchema = roleDocumentJobSchema;

export type RolesQueueJob = z.infer<typeof rolesQueueJobSchema>;
