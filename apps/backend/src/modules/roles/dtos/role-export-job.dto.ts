import { z } from 'zod';

export const roleExportJobSchema = z.object({
  type: z.literal('generate-export'),
  roleExportId: z.uuid(),
});

export type RoleExportJob = z.infer<typeof roleExportJobSchema>;
