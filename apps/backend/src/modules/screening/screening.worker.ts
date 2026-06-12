import { Worker, type ConnectionOptions } from 'bullmq';

import { SCREENING_QUEUE_NAME } from '../../queues/screening.queue';
import { screeningJobSchema } from './dtos/screening-job.dto';
import type { ScreeningService } from './screening.service';

export const SCREENING_WORKER_COUNT = 2;

export class ScreeningWorkers {
  private readonly workers: Worker[] = [];

  constructor(
    connection: ConnectionOptions,
    private readonly screeningService: ScreeningService,
  ) {
    for (let i = 0; i < SCREENING_WORKER_COUNT; i++) {
      const worker = new Worker(
        SCREENING_QUEUE_NAME,
        async (job) => {
          const payload = screeningJobSchema.parse(job.data);
          await this.screeningService.process(payload);
        },
        { connection, concurrency: 1 },
      );

      worker.on('failed', (job, error) => {
        console.error(`Screening job ${job?.id ?? 'unknown'} failed:`, error);
      });

      this.workers.push(worker);
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
