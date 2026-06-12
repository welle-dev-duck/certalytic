import type { EmailJob } from './dtos/email-job.dto';

export class EmailsService {
  async process(job: EmailJob): Promise<void> {
    switch (job.type) {
      case 'reset-password':
        console.log('sendResetPassword', { user: job.user, url: job.url });
        break;
      case 'verification':
        console.log('sendVerificationEmail', { user: job.user, url: job.url });
        break;
      case 'invitation':
        console.log('sendInvitationEmail', {
          email: job.email,
          organization: job.organization,
          inviter: job.inviter,
          invitation: job.invitation,
        });
        break;
    }
  }
}
