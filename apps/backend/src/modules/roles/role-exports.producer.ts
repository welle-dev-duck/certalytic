import type { Queue } from 'bullmq';

import type { RoleExportJob } from './dtos/role-export-job.dto';

export class RoleExportsProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueGenerateExport(
    data: Omit<RoleExportJob, 'type'>,
    options?: { priority?: number },
  ): Promise<void> {
    await this.queue.add(
      'generate-export',
      {
        type: 'generate-export',
        ...data,
      },
      options,
    );
  }
}
