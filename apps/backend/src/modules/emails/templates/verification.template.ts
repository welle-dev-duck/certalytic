import type { VerificationEmailJob } from '../dtos/verification.dto';
import { renderEmailLayout } from './layout';
import { escapeHtml } from './utils';

export function buildVerificationEmail(job: VerificationEmailJob) {
  const recipientName = escapeHtml(job.user.name);

  const { html, text } = renderEmailLayout({
    previewText: 'Verify your Certalytic email address.',
    title: 'Verify your email',
    bodyHtml: `<p style="margin:0 0 12px;">Hi ${recipientName},</p>
<p style="margin:0;">Thanks for signing up for Certalytic. Confirm your email address to activate your account and start screening candidates.</p>`,
    ctaLabel: 'Verify email',
    ctaUrl: job.url,
  });

  return {
    to: job.user.email,
    subject: 'Verify your Certalytic email',
    html,
    text,
  };
}
