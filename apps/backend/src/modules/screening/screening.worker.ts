import type { ConnectionOptions } from 'bullmq';

import { createQueueWorker } from '../../lib/queue-worker';
import { logger } from '../../lib/logger';
import { SCREENING_JOB_ATTEMPTS } from '../../queues/screening.queue-options';
import { SCREENING_QUEUE_NAME } from '../../queues/screening.queue';
import { processCandidateJobSchema } from './dtos/screening-job.dto';
import type { ScreeningService } from './screening.service';

export const SCREENING_WORKER_CONCURRENCY = 2;

function isFinalAttempt(
  attemptsMade: number,
  maxAttempts: number | undefined,
): boolean {
  const limit = maxAttempts ?? SCREENING_JOB_ATTEMPTS;
  return attemptsMade >= limit;
}

export class ScreeningWorkers {
  private readonly worker;

  constructor(
    connection: ConnectionOptions,
    private readonly screeningService: ScreeningService,
  ) {
    this.worker = createQueueWorker(
      SCREENING_QUEUE_NAME,
      async (job) => {
        const payload = processCandidateJobSchema.parse(job.data);
        await this.screeningService.process(payload);
      },
      connection,
      SCREENING_WORKER_CONCURRENCY,
    );

    this.worker.on('failed', (job, error) => {
      if (!job) {
        return;
      }

      const parsed = processCandidateJobSchema.safeParse(job.data);

      if (!parsed.success) {
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
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
