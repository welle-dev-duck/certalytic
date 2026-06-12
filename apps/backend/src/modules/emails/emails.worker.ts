import { Worker, type ConnectionOptions } from 'bullmq';

import { EMAILS_QUEUE_NAME } from '../../queues/emails.queue';
import { emailJobSchema } from './dtos/email-job.dto';
import type { EmailsService } from './emails.service';

export const EMAIL_WORKER_COUNT = 5;

export class EmailsWorkers {
  private readonly workers: Worker[] = [];

  constructor(
    connection: ConnectionOptions,
    private readonly emailsService: EmailsService,
  ) {
    for (let i = 0; i < EMAIL_WORKER_COUNT; i++) {
      const worker = new Worker(
        EMAILS_QUEUE_NAME,
        async (job) => {
          const payload = emailJobSchema.parse(job.data);
          await this.emailsService.process(payload);
        },
        { connection, concurrency: 1 },
      );

      worker.on('failed', (job, error) => {
        console.error(`Email job ${job?.id ?? 'unknown'} failed:`, error);
      });

      this.workers.push(worker);
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
