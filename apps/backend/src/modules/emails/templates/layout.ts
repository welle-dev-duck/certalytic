import { escapeHtml } from './utils';

type EmailLayoutInput = {
  previewText: string;
  title: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
};

export function renderEmailLayout(input: EmailLayoutInput): {
  html: string;
  text: string;
} {
  const title = escapeHtml(input.title);
  const previewText = escapeHtml(input.previewText);
  const ctaLabel = escapeHtml(input.ctaLabel);
  const ctaUrl = escapeHtml(input.ctaUrl);
  const footerNote = input.footerNote
    ? escapeHtml(input.footerNote)
    : 'If you did not request this email, you can safely ignore it.';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f7f6;color:#1f3330;font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;">
    <span style="display:none;max-height:0;overflow:hidden;opacity:0;">${previewText}</span>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f7f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #d7e2df;">
            <tr>
              <td style="padding:28px 32px 12px;border-bottom:1px solid #e6eeeb;">
                <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#2f5f57;">Certalytic</p>
                <h1 style="margin:12px 0 0;font-size:28px;line-height:1.15;font-weight:600;color:#1f3330;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;font-size:15px;line-height:1.6;color:#4d6661;">
                ${input.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <a href="${ctaUrl}" style="display:inline-block;background-color:#2f5f57;color:#f8fcfb;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border:1px solid #244a44;">
                  ${ctaLabel}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;font-size:12px;line-height:1.5;color:#6b8480;">
                <p style="margin:0 0 8px;">Or copy this link into your browser:</p>
                <p style="margin:0;word-break:break-all;"><a href="${ctaUrl}" style="color:#2f5f57;">${ctaUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 24px;border-top:1px solid #e6eeeb;font-size:12px;line-height:1.5;color:#7a918d;">
                ${footerNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${input.title}

${input.previewText}

${ctaLabel}: ${input.ctaUrl}

${footerNote}`;

  return { html, text };
}
