import { z } from 'zod';

export const billingRefundJobSchema = z.object({
  type: z.literal('screening-refund'),
  organizationId: z.uuid(),
  candidateId: z.uuid(),
  amount: z.number().int().positive().default(1),
});

export type BillingRefundJob = z.infer<typeof billingRefundJobSchema>;
