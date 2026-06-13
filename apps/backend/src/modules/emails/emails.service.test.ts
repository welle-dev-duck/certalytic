import { describe, expect, it, vi } from 'vitest';

import {
  invitationJob,
  resetPasswordJob,
  verificationJob,
} from '../../test/fixtures/email-jobs';
import { EmailsService } from './emails.service';
import { emailJobSchema } from './dtos/email-job.dto';
import type { EmailMailer } from './resend-mailer';

function createMailerMock(): EmailMailer {
  return {
    isConfigured: vi.fn(() => true),
    send: vi.fn(async () => undefined),
  };
}

describe('EmailsService', () => {
  it('sends reset-password emails', async () => {
    const mailer = createMailerMock();
    const service = new EmailsService(mailer);

    await service.process(resetPasswordJob);

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: resetPasswordJob.user.email,
        subject: 'Reset your Certalytic password',
        html: expect.stringContaining('Reset your password'),
        text: expect.stringContaining(resetPasswordJob.url),
        tags: [
          { name: 'type', value: 'reset-password' },
          { name: 'user_id', value: resetPasswordJob.user.id },
        ],
      }),
    );
  });

  it('sends verification emails', async () => {
    const mailer = createMailerMock();
    const service = new EmailsService(mailer);

    await service.process(verificationJob);

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: verificationJob.user.email,
        subject: 'Verify your Certalytic email',
        html: expect.stringContaining('Verify your email'),
        text: expect.stringContaining(verificationJob.url),
        tags: [
          { name: 'type', value: 'verification' },
          { name: 'user_id', value: verificationJob.user.id },
        ],
      }),
    );
  });

  it('sends invitation emails', async () => {
    const mailer = createMailerMock();
    const service = new EmailsService(mailer);

    await service.process(invitationJob);

    expect(mailer.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: invitationJob.email,
        subject: 'Join Acme Inc on Certalytic',
        html: expect.stringContaining('You have been invited'),
        text: expect.stringContaining(invitationJob.inviteLink),
        tags: [{ name: 'type', value: 'invitation' }],
      }),
    );
  });
});

describe('emailJobSchema', () => {
  it('accepts all supported job types', () => {
    expect(emailJobSchema.parse(resetPasswordJob)).toEqual(resetPasswordJob);
    expect(emailJobSchema.parse(verificationJob)).toEqual(verificationJob);
    expect(emailJobSchema.parse(invitationJob)).toEqual(invitationJob);
  });

  it('rejects unknown job types', () => {
    expect(() =>
      emailJobSchema.parse({
        type: 'newsletter',
        email: 'user@example.com',
      }),
    ).toThrow();
  });
});
