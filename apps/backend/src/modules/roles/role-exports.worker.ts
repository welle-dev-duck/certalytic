import type { ConnectionOptions } from 'bullmq';

import { createQueueWorker } from '../../lib/queue-worker';
import { logger } from '../../lib/logger';
import { ROLE_EXPORTS_QUEUE_NAME } from '../../queues/role-exports.queue';
import { roleExportJobSchema } from './dtos/role-export-job.dto';
import type { RolesExportService } from './roles-export.service';

export const ROLE_EXPORTS_WORKER_CONCURRENCY = 1;

export class RoleExportsWorkers {
  private readonly worker;

  constructor(
    connection: ConnectionOptions,
    private readonly rolesExportService: RolesExportService,
  ) {
    this.worker = createQueueWorker(
      ROLE_EXPORTS_QUEUE_NAME,
      async (job) => {
        const payload = roleExportJobSchema.parse(job.data);
        await this.rolesExportService.process(payload.roleExportId);
      },
      connection,
      ROLE_EXPORTS_WORKER_CONCURRENCY,
    );

    this.worker.on('failed', (job, error) => {
      logger.error(
        {
          err: error,
          jobId: job?.id,
          roleExportId: job?.data?.roleExportId,
        },
        'Role export job failed',
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
