import { describe, expect, it, vi } from 'vitest';

import {
  invitationJob,
  resetPasswordJob,
  verificationJob,
} from '../../test/fixtures/email-jobs';
import { EmailsService } from './emails.service';
import { emailJobSchema } from './dtos/email-job.dto';

describe('EmailsService', () => {
  it('processes reset-password jobs', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const service = new EmailsService();

    await service.process(resetPasswordJob);

    expect(log).toHaveBeenCalledWith('sendResetPassword', {
      user: resetPasswordJob.user,
      url: resetPasswordJob.url,
    });

    log.mockRestore();
  });

  it('processes verification jobs', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const service = new EmailsService();

    await service.process(verificationJob);

    expect(log).toHaveBeenCalledWith('sendVerificationEmail', {
      user: verificationJob.user,
      url: verificationJob.url,
    });

    log.mockRestore();
  });

  it('processes invitation jobs', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const service = new EmailsService();

    await service.process(invitationJob);

    expect(log).toHaveBeenCalledWith('sendInvitationEmail', {
      email: invitationJob.email,
      organization: invitationJob.organization,
      inviter: invitationJob.inviter,
      invitation: invitationJob.invitation,
      inviteLink: invitationJob.inviteLink,
    });

    log.mockRestore();
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
