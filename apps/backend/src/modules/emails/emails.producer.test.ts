import type { Queue } from 'bullmq';
import { describe, expect, it } from 'vitest';

import { createMockQueue } from '../../test/helpers/mocks';
import {
  invitationJob,
  resetPasswordJob,
  testInvitation,
  testOrganization,
  testUser,
  verificationJob,
} from '../../test/fixtures/email-jobs';
import { EmailsProducer } from './emails.producer';

describe('EmailsProducer', () => {
  it('enqueues reset-password jobs', async () => {
    const queue = createMockQueue();
    const producer = new EmailsProducer(queue as unknown as Queue);

    await producer.enqueueResetPassword({
      user: resetPasswordJob.user,
      url: resetPasswordJob.url,
    });

    expect(queue.add).toHaveBeenCalledWith('reset-password', resetPasswordJob);
  });

  it('enqueues verification jobs', async () => {
    const queue = createMockQueue();
    const producer = new EmailsProducer(queue as unknown as Queue);

    await producer.enqueueVerification({
      user: verificationJob.user,
      url: verificationJob.url,
    });

    expect(queue.add).toHaveBeenCalledWith('verification', verificationJob);
  });

  it('enqueues invitation jobs', async () => {
    const queue = createMockQueue();
    const producer = new EmailsProducer(queue as unknown as Queue);

    await producer.enqueueInvitation({
      email: 'invitee@example.com',
      organization: testOrganization,
      inviter: testUser,
      invitation: testInvitation,
      inviteLink: invitationJob.inviteLink,
    });

    expect(queue.add).toHaveBeenCalledWith('invitation', invitationJob);
  });
});
