import type { ResetPasswordEmailJob } from '../dtos/reset-password.dto';
import { renderEmailLayout } from './layout';
import { escapeHtml } from './utils';

export function buildResetPasswordEmail(job: ResetPasswordEmailJob) {
  const recipientName = escapeHtml(job.user.name);

  const { html, text } = renderEmailLayout({
    previewText: 'Reset your Certalytic password.',
    title: 'Reset your password',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${recipientName},</p>
<p style="margin:0;">We received a request to reset the password for your Certalytic account. Use the button below to choose a new password. This link expires soon.</p>`,
    ctaLabel: 'Reset password',
    ctaUrl: job.url,
  });

  return {
    to: job.user.email,
    subject: 'Reset your Certalytic password',
    html,
    text,
  };
}
