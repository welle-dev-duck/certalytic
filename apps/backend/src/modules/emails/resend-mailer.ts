import { Resend } from 'resend';

import { env } from '../../config/env';
import { AppError } from '../../lib/errors';
import { logger } from '../../lib/logger';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  tags?: Array<{ name: string; value: string }>;
};

export type EmailMailer = {
  isConfigured(): boolean;
  send(input: SendEmailInput): Promise<void>;
};

export function buildFromAddress(): string {
  return `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_ADDRESS}>`;
}

export function createResendMailer(): EmailMailer {
  const client = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  const configured = Boolean(client && env.RESEND_FROM_ADDRESS);

  return {
    isConfigured() {
      return configured;
    },

    async send(input) {
      if (!client || !env.RESEND_FROM_ADDRESS) {
        logger.info(
          {
            to: input.to,
            subject: input.subject,
            tags: input.tags,
          },
          'Email delivery stub (Resend not configured)',
        );
        return;
      }

      const { data, error } = await client.emails.send({
        from: buildFromAddress(),
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        tags: input.tags,
      });

      if (error) {
        throw new AppError(
          error.message || 'Failed to send email.',
          502,
          'EMAIL_DELIVERY_FAILED',
        );
      }

      logger.info(
        {
          to: input.to,
          subject: input.subject,
          messageId: data?.id,
          tags: input.tags,
        },
        'Email sent',
      );
    },
  };
}
