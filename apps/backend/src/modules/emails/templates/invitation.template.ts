import type { InvitationEmailJob } from '../dtos/invitation.dto';
import { renderEmailLayout } from './layout';
import { escapeHtml, readEntityName } from './utils';

export function buildInvitationEmail(job: InvitationEmailJob) {
  const organizationName = escapeHtml(
    readEntityName(job.organization) ?? 'a Certalytic team',
  );
  const inviterName = escapeHtml(
    readEntityName(job.inviter) ?? 'A teammate',
  );

  const { html, text } = renderEmailLayout({
    previewText: `${inviterName} invited you to join ${organizationName} on Certalytic.`,
    title: 'You have been invited',
    bodyHtml: `<p style="margin:0 0 12px;">Hi,</p>
<p style="margin:0 0 12px;"><strong>${inviterName}</strong> invited you to join <strong>${organizationName}</strong> on Certalytic.</p>
<p style="margin:0;">Accept the invitation to collaborate on hiring integrity screenings, roles, and candidate reports.</p>`,
    ctaLabel: 'Accept invitation',
    ctaUrl: job.inviteLink,
    footerNote:
      'This invitation expires in 48 hours. If you were not expecting this email, you can ignore it.',
  });

  return {
    to: job.email,
    subject: `Join ${readEntityName(job.organization) ?? 'your team'} on Certalytic`,
    html,
    text,
  };
}
