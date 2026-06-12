import { Queue, type ConnectionOptions } from 'bullmq';

import { billingRefundQueueDefaultJobOptions } from './billing-refund.queue-options';

export const BILLING_REFUND_QUEUE_NAME = 'billing-refunds';

export function createBillingRefundQueue(
  connection: ConnectionOptions,
): Queue {
  return new Queue(BILLING_REFUND_QUEUE_NAME, {
    connection,
    defaultJobOptions: billingRefundQueueDefaultJobOptions,
  });
}
