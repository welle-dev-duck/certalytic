import type { Queue } from 'bullmq';

import type { RoleExportJob } from '../roles/dtos/role-export-job.dto';
import type { ProcessCandidateJob } from './dtos/screening-job.dto';

export class ScreeningProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueProcessCandidate(
    data: Omit<ProcessCandidateJob, 'type'>,
    options?: { priority?: number },
  ): Promise<void> {
    await this.queue.add(
      'process-candidate',
      {
        type: 'process-candidate',
        ...data,
      },
      options,
    );
  }

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
