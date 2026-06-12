import type { Queue } from 'bullmq';

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
}
