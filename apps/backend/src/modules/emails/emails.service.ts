import type { EmailJob } from './dtos/email-job.dto';
import {
  createResendMailer,
  type EmailMailer,
} from './resend-mailer';
import { buildInvitationEmail } from './templates/invitation.template';
import { buildResetPasswordEmail } from './templates/reset-password.template';
import { buildVerificationEmail } from './templates/verification.template';

export class EmailsService {
  constructor(private readonly mailer: EmailMailer = createResendMailer()) {}

  async process(job: EmailJob): Promise<void> {
    switch (job.type) {
      case 'reset-password':
        await this.mailer.send({
          ...buildResetPasswordEmail(job),
          tags: [
            { name: 'type', value: 'reset-password' },
            { name: 'user_id', value: job.user.id },
          ],
        });
        break;
      case 'verification':
        await this.mailer.send({
          ...buildVerificationEmail(job),
          tags: [
            { name: 'type', value: 'verification' },
            { name: 'user_id', value: job.user.id },
          ],
        });
        break;
      case 'invitation':
        await this.mailer.send({
          ...buildInvitationEmail(job),
          tags: [{ name: 'type', value: 'invitation' }],
        });
        break;
    }
  }
}
