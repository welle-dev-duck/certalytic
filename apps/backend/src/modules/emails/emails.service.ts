import type { EmailJob } from './dtos/email-job.dto';
import { env } from '../../config/env';
import { logger } from '../../lib/logger';

function readEntityId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return undefined;
  }

  return typeof value.id === 'string' ? value.id : undefined;
}

function logEmailStub(
  payload: Record<string, unknown>,
  message: string,
): void {
  if (env.NODE_ENV === 'development') {
    logger.info(payload, message);
    return;
  }

  logger.debug(payload, message);
}

export class EmailsService {
  async process(job: EmailJob): Promise<void> {
    switch (job.type) {
      case 'reset-password':
        logEmailStub(
          { userId: job.user.id, url: job.url },
          'sendResetPassword',
        );
        break;
      case 'verification':
        logEmailStub(
          { userId: job.user.id, url: job.url },
          'sendVerificationEmail',
        );
        break;
      case 'invitation':
        logEmailStub(
          {
            email: job.email,
            organizationId: readEntityId(job.organization),
            invitationId: readEntityId(job.invitation),
          },
          'sendInvitationEmail',
        );
        break;
    }
  }
}
