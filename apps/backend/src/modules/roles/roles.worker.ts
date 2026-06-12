import type { ConnectionOptions } from 'bullmq';

import { createQueueWorker } from '../../lib/queue-worker';
import { logger } from '../../lib/logger';
import { ROLES_QUEUE_NAME } from '../../queues/roles.queue';
import { rolesQueueJobSchema } from './dtos/roles-queue-job.dto';
import type { RolesDocumentService } from './roles-document.service';

export const ROLES_WORKER_CONCURRENCY = 2;

export class RolesWorkers {
  private readonly worker;

  constructor(
    connection: ConnectionOptions,
    private readonly rolesDocumentService: RolesDocumentService,
  ) {
    this.worker = createQueueWorker(
      ROLES_QUEUE_NAME,
      async (job) => {
        const payload = rolesQueueJobSchema.parse(job.data);
        await this.rolesDocumentService.process(payload);
      },
      connection,
      ROLES_WORKER_CONCURRENCY,
    );

    this.worker.on('failed', (job, error) => {
      logger.error(
        { err: error, jobId: job?.id ?? 'unknown' },
        'Roles job failed',
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
