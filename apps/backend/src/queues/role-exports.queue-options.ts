export const ROLE_EXPORTS_JOB_ATTEMPTS = 3;

export const ROLE_EXPORTS_JOB_BACKOFF = {
  type: 'exponential' as const,
  delay: 5_000,
};

export const roleExportsQueueDefaultJobOptions = {
  attempts: ROLE_EXPORTS_JOB_ATTEMPTS,
  backoff: ROLE_EXPORTS_JOB_BACKOFF,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
