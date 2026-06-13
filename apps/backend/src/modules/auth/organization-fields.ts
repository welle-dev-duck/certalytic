import { z } from 'zod';

import {
  ORGANIZATION_COUNTRY_DEFAULT,
  organizationCountryInputSchema,
} from '../../lib/country-code';

export const organizationAdditionalFields = {
  country: {
    type: 'string' as const,
    required: false,
    default: ORGANIZATION_COUNTRY_DEFAULT,
    validator: {
      input: organizationCountryInputSchema,
    },
  },
  language: {
    type: 'string' as const,
    validator: {
      input: z.enum(['en', 'de']),
    },
    required: false,
    default: 'en',
  },
};

export const organizationSchemaConfig = {
  organization: {
    additionalFields: organizationAdditionalFields,
  },
} as const;
