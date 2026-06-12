import type { ConnectionOptions } from 'bullmq';

import { createQueueWorker } from '../../lib/queue-worker';
import { logger } from '../../lib/logger';
import { BILLING_REFUND_QUEUE_NAME } from '../../queues/billing-refund.queue';
import type { BillingService } from './billing.service';
import { billingRefundJobSchema } from './dtos/billing-refund-job.dto';

export const BILLING_REFUND_WORKER_CONCURRENCY = 1;

export class BillingRefundWorkers {
  private readonly worker;

  constructor(
    connection: ConnectionOptions,
    private readonly billingService: BillingService,
  ) {
    this.worker = createQueueWorker(
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
      connection,
      BILLING_REFUND_WORKER_CONCURRENCY,
    );

    this.worker.on('failed', (job, error) => {
      logger.error(
        {
          err: error,
          jobId: job?.id,
          candidateId: job?.data?.candidateId,
        },
        'Billing refund job failed',
      );
    });
  }

  async close(): Promise<void> {
    await this.worker.close();
  }
}
