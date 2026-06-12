import type { Queue } from 'bullmq';

import type { BillingRefundJob } from './dtos/billing-refund-job.dto';

export class BillingRefundProducer {
  constructor(private readonly queue: Queue) {}

  async enqueueScreeningRefund(
    data: Pick<BillingRefundJob, 'organizationId' | 'candidateId' | 'amount'>,
  ): Promise<void> {
    await this.queue.add(
      'screening-refund',
      {
        type: 'screening-refund' as const,
        amount: data.amount ?? 1,
        organizationId: data.organizationId,
        candidateId: data.candidateId,
      },
      {
        jobId: `screening-refund-${data.candidateId}`,
      },
    );
  }
}
