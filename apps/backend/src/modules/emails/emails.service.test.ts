import { describe, expect, it, vi } from 'vitest';

import { logger } from '../../lib/logger';
import {
  invitationJob,
  resetPasswordJob,
  verificationJob,
} from '../../test/fixtures/email-jobs';
import { EmailsService } from './emails.service';
import { emailJobSchema } from './dtos/email-job.dto';

describe('EmailsService', () => {
  it('processes reset-password jobs', async () => {
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const service = new EmailsService();

    await service.process(resetPasswordJob);

    expect(debug).toHaveBeenCalledWith(
      { userId: resetPasswordJob.user.id, url: resetPasswordJob.url },
      'sendResetPassword',
    );

    debug.mockRestore();
  });

  it('processes verification jobs', async () => {
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const service = new EmailsService();

    await service.process(verificationJob);

    expect(debug).toHaveBeenCalledWith(
      { userId: verificationJob.user.id, url: verificationJob.url },
      'sendVerificationEmail',
    );

    debug.mockRestore();
  });

  it('processes invitation jobs', async () => {
    const debug = vi.spyOn(logger, 'debug').mockImplementation(() => undefined);
    const service = new EmailsService();

    await service.process(invitationJob);

    expect(debug).toHaveBeenCalledWith(
      {
        email: invitationJob.email,
        organizationId: invitationJob.organization.id,
        invitationId: invitationJob.invitation.id,
      },
      'sendInvitationEmail',
    );

    debug.mockRestore();
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
