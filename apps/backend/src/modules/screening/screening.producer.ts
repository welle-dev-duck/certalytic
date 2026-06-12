import type { Queue } from 'bullmq';

import type { ScreeningJob } from './dtos/screening-job.dto';

export class ScreeningProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueProcessCandidate(
    data: Omit<ScreeningJob, 'type'>,
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
