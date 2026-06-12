import type { ConnectionOptions } from 'bullmq';

import { createQueueWorker } from '../../lib/queue-worker';
import { logger } from '../../lib/logger';
import { EMAILS_QUEUE_NAME } from '../../queues/emails.queue';
import { emailJobSchema } from './dtos/email-job.dto';
import type { EmailsService } from './emails.service';

export const EMAIL_WORKER_CONCURRENCY = 5;

export class EmailsWorkers {
  private readonly worker;

  constructor(
    connection: ConnectionOptions,
    private readonly emailsService: EmailsService,
  ) {
    this.worker = createQueueWorker(
      EMAILS_QUEUE_NAME,
      async (job) => {
        const payload = emailJobSchema.parse(job.data);
        await this.emailsService.process(payload);
      },
      connection,
      EMAIL_WORKER_CONCURRENCY,
    );

    this.worker.on('failed', (job, error) => {
      logger.error(
        { err: error, jobId: job?.id ?? 'unknown' },
        'Email job failed',
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
