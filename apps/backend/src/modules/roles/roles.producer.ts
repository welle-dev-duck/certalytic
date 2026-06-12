import type { Queue } from 'bullmq';

import type { RoleDocumentJob } from './dtos/role-document-job.dto';
import type { RoleExportJob } from './dtos/role-export-job.dto';

export class RolesProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueProcessDocument(
    data: Omit<RoleDocumentJob, 'type'>,
  ): Promise<void> {
    await this.queue.add('process-document', {
      type: 'process-document',
      ...data,
    });
  }

  async enqueueGenerateExport(
    data: Omit<RoleExportJob, 'type'>,
  ): Promise<void> {
    await this.queue.add('generate-export', {
      type: 'generate-export',
      ...data,
    });
  }
}
