import { describe, expect, it } from 'vitest';

import {
  invitationJob,
  resetPasswordJob,
  verificationJob,
} from '../../../test/fixtures/email-jobs';
import { buildInvitationEmail } from './invitation.template';
import { buildResetPasswordEmail } from './reset-password.template';
import { buildVerificationEmail } from './verification.template';

describe('email templates', () => {
  it('builds reset-password content with html and text fallbacks', () => {
    const email = buildResetPasswordEmail(resetPasswordJob);

    expect(email.to).toBe(resetPasswordJob.user.email);
    expect(email.subject).toContain('Reset your Certalytic password');
    expect(email.html).toContain(resetPasswordJob.url);
    expect(email.text).toContain(resetPasswordJob.url);
    expect(email.html).toContain('Certalytic');
  });

  it('builds verification content with html and text fallbacks', () => {
    const email = buildVerificationEmail(verificationJob);

    expect(email.to).toBe(verificationJob.user.email);
    expect(email.subject).toContain('Verify your Certalytic email');
    expect(email.html).toContain(verificationJob.url);
    expect(email.text).toContain(verificationJob.url);
  });

  it('builds invitation content with organization and inviter names', () => {
    const email = buildInvitationEmail(invitationJob);

    expect(email.to).toBe(invitationJob.email);
    expect(email.subject).toBe('Join Acme Inc on Certalytic');
    expect(email.html).toContain('Acme Inc');
    expect(email.html).toContain('Test User');
    expect(email.html).toContain(invitationJob.inviteLink);
    expect(email.text).toContain(invitationJob.inviteLink);
  });
});
