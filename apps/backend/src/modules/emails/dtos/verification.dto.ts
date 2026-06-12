import { z } from 'zod';

import { emailUserSchema } from './email-user.dto';

export const verificationEmailJobSchema = z.object({
  type: z.literal('verification'),
  user: emailUserSchema,
  url: z.string().url(),
});

export type VerificationEmailJob = z.infer<typeof verificationEmailJobSchema>;
