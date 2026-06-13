import { z } from 'zod';

import { ORG_ROLES } from '../../types/organization';

export const organizationSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  country: z.string().nullable().optional(),
  language: z.enum(['en', 'de']).nullable().optional(),
});

export const activeOrganizationResponseSchema = z.object({
  organization: organizationSummarySchema,
  role: z.enum(ORG_ROLES),
});

export type ActiveOrganizationResponseDto = z.infer<
  typeof activeOrganizationResponseSchema
>;
