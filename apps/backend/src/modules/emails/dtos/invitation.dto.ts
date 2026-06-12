import { z } from 'zod';

export const invitationEmailJobSchema = z.object({
  type: z.literal('invitation'),
  email: z.string().email(),
  organization: z.unknown(),
  inviter: z.unknown(),
  invitation: z.unknown(),
  inviteLink: z.string().url(),
});

export type InvitationEmailJob = z.infer<typeof invitationEmailJobSchema>;

export type EnqueueInvitationInput = {
  email: string;
  organization: unknown;
  inviter: unknown;
  invitation: unknown;
  inviteLink: string;
};
