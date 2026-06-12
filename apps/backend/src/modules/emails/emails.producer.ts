import type { Queue } from 'bullmq';

import type { EnqueueInvitationInput } from './dtos/invitation.dto';
import type { ResetPasswordEmailJob } from './dtos/reset-password.dto';
import type { VerificationEmailJob } from './dtos/verification.dto';

export class EmailsProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueResetPassword(
    data: Omit<ResetPasswordEmailJob, 'type'>,
  ): Promise<void> {
    await this.queue.add('reset-password', {
      type: 'reset-password',
      ...data,
    });
  }

  async enqueueVerification(
    data: Omit<VerificationEmailJob, 'type'>,
  ): Promise<void> {
    await this.queue.add('verification', {
      type: 'verification',
      ...data,
    });
  }

  async enqueueInvitation(data: EnqueueInvitationInput): Promise<void> {
    await this.queue.add('invitation', {
      type: 'invitation',
      ...data,
    });
  }
}
