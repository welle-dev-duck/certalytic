import { z } from 'zod';

import { ORG_ROLES } from '../../types/organization';

export const organizationSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
});

export const activeOrganizationResponseSchema = z.object({
  organization: organizationSummarySchema,
  role: z.enum(ORG_ROLES),
});

export type ActiveOrganizationResponseDto = z.infer<
  typeof activeOrganizationResponseSchema
>;
