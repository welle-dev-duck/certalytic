import { Worker, type ConnectionOptions } from 'bullmq';

import { logger } from '../../lib/logger';
import { BILLING_REFUND_QUEUE_NAME } from '../../queues/billing-refund.queue';
import type { BillingService } from './billing.service';
import { billingRefundJobSchema } from './dtos/billing-refund-job.dto';

export const BILLING_REFUND_WORKER_COUNT = 1;

export class BillingRefundWorkers {
  private readonly workers: Worker[] = [];

  constructor(
    connection: ConnectionOptions,
    private readonly billingService: BillingService,
  ) {
    for (let i = 0; i < BILLING_REFUND_WORKER_COUNT; i++) {
      const worker = new Worker(
        BILLING_REFUND_QUEUE_NAME,
        async (job) => {
          const payload = billingRefundJobSchema.parse(job.data);

          await this.billingService.refundScreening(
            payload.organizationId,
            payload.amount,
          );

          logger.info(
            {
              candidateId: payload.candidateId,
              organizationId: payload.organizationId,
              amount: payload.amount,
              jobId: job.id,
            },
            'Screening token refund processed',
          );
        },
        { connection, concurrency: 1 },
      );

      worker.on('failed', (job, error) => {
        logger.error(
          {
            err: error,
            jobId: job?.id,
            candidateId: job?.data?.candidateId,
          },
          'Billing refund job failed',
        );
      });

      this.workers.push(worker);
    }
  }

  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
  }
}
