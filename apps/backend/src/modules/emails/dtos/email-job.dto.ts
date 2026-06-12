import { z } from 'zod';

import { invitationEmailJobSchema } from './invitation.dto';
import { resetPasswordEmailJobSchema } from './reset-password.dto';
import { verificationEmailJobSchema } from './verification.dto';

export const emailJobSchema = z.discriminatedUnion('type', [
  resetPasswordEmailJobSchema,
  verificationEmailJobSchema,
  invitationEmailJobSchema,
]);

export type EmailJob = z.infer<typeof emailJobSchema>;
