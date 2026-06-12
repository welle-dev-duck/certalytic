import { z } from 'zod';

import { emailUserSchema } from './email-user.dto';

export const resetPasswordEmailJobSchema = z.object({
  type: z.literal('reset-password'),
  user: emailUserSchema,
  url: z.string().url(),
});

export type ResetPasswordEmailJob = z.infer<typeof resetPasswordEmailJobSchema>;
