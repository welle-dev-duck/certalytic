export const EMAIL_JOB_ATTEMPTS = 5;

export const EMAIL_JOB_BACKOFF = {
  type: 'exponential' as const,
  delay: 5_000,
};

export const emailsQueueDefaultJobOptions = {
  attempts: EMAIL_JOB_ATTEMPTS,
  backoff: EMAIL_JOB_BACKOFF,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
