import { Worker, type ConnectionOptions } from 'bullmq';

import { logger } from '../../lib/logger';
import { SCREENING_JOB_ATTEMPTS } from '../../queues/screening.queue-options';
import { SCREENING_QUEUE_NAME } from '../../queues/screening.queue';
import type { RolesExportService } from '../roles/roles-export.service';
import { screeningQueueJobSchema } from './dtos/screening-job.dto';
import type { ScreeningService } from './screening.service';

export const SCREENING_WORKER_COUNT = 2;

function isFinalAttempt(
  attemptsMade: number,
  maxAttempts: number | undefined,
): boolean {
  const limit = maxAttempts ?? SCREENING_JOB_ATTEMPTS;
  return attemptsMade >= limit;
}

export class ScreeningWorkers {
  private readonly workers: Worker[] = [];

  constructor(
    connection: ConnectionOptions,
    private readonly screeningService: ScreeningService,
    private readonly rolesExportService: RolesExportService,
  ) {
    for (let i = 0; i < SCREENING_WORKER_COUNT; i++) {
      const worker = new Worker(
        SCREENING_QUEUE_NAME,
        async (job) => {
          const payload = screeningQueueJobSchema.parse(job.data);

          if (payload.type === 'generate-export') {
            await this.rolesExportService.process(payload.roleExportId);
            return;
          }

          await this.screeningService.process(payload);
        },
        { connection, concurrency: 1 },
      );

      worker.on('failed', (job, error) => {
        if (!job) {
          return;
        }

        const parsed = screeningQueueJobSchema.safeParse(job.data);

        if (!parsed.success || parsed.data.type !== 'process-candidate') {
          logger.error(
            { err: error, jobId: job.id },
            'Screening queue job failed',
          );
          return;
        }

        const candidateId = parsed.data.candidateId;

        if (!isFinalAttempt(job.attemptsMade, job.opts.attempts)) {
          logger.warn(
            {
              err: error,
              jobId: job.id,
              candidateId,
              attempt: job.attemptsMade,
              maxAttempts: job.opts.attempts ?? SCREENING_JOB_ATTEMPTS,
            },
            'Screening job attempt failed, retrying',
          );
          return;
        }

        void this.screeningService
          .handlePermanentFailure(candidateId, error)
          .catch((failureError) => {
            logger.error(
              {
                err: failureError,
                jobId: job.id,
                candidateId,
              },
              'Failed to finalize permanently failed screening job',
            );
          });
      });

      this.workers.push(worker);
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
