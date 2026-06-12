export const BILLING_REFUND_JOB_ATTEMPTS = 5;

export const BILLING_REFUND_JOB_BACKOFF = {
  type: 'exponential' as const,
  delay: 3_000,
};

export const billingRefundQueueDefaultJobOptions = {
  attempts: BILLING_REFUND_JOB_ATTEMPTS,
  backoff: BILLING_REFUND_JOB_BACKOFF,
  removeOnComplete: { count: 200 },
  removeOnFail: { count: 500 },
};
