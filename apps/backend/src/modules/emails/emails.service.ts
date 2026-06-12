import type { EmailJob } from './dtos/email-job.dto';
import { logger } from '../../lib/logger';

function readEntityId(value: unknown): string | undefined {
  if (typeof value !== 'object' || value === null || !('id' in value)) {
    return undefined;
  }

  return typeof value.id === 'string' ? value.id : undefined;
}

export class EmailsService {
  async process(job: EmailJob): Promise<void> {
    switch (job.type) {
      case 'reset-password':
        logger.debug({ userId: job.user.id, url: job.url }, 'sendResetPassword');
        break;
      case 'verification':
        logger.debug({ userId: job.user.id, url: job.url }, 'sendVerificationEmail');
        break;
      case 'invitation':
        logger.debug(
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
