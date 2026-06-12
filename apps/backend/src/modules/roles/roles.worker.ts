import { Worker, type ConnectionOptions } from 'bullmq';

import { ROLES_QUEUE_NAME } from '../../queues/roles.queue';
import { rolesQueueJobSchema } from './dtos/roles-queue-job.dto';
import type { RolesDocumentService } from './roles-document.service';
import type { RolesExportService } from './roles-export.service';

export const ROLES_WORKER_COUNT = 2;

export class RolesWorkers {
  private readonly workers: Worker[] = [];

  constructor(
    connection: ConnectionOptions,
    private readonly rolesDocumentService: RolesDocumentService,
    private readonly rolesExportService: RolesExportService,
  ) {
    for (let i = 0; i < ROLES_WORKER_COUNT; i++) {
      const worker = new Worker(
        ROLES_QUEUE_NAME,
        async (job) => {
          const payload = rolesQueueJobSchema.parse(job.data);

          if (payload.type === 'process-document') {
            await this.rolesDocumentService.process(payload);
            return;
          }

          await this.rolesExportService.process(payload.roleExportId);
        },
        { connection, concurrency: 1 },
      );

      worker.on('failed', (job, error) => {
        console.error(`Roles job ${job?.id ?? 'unknown'} failed:`, error);
      });

      this.workers.push(worker);
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
