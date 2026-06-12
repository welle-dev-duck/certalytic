export const SCREENING_JOB_ATTEMPTS = 5;

export const SCREENING_JOB_BACKOFF = {
  type: 'exponential' as const,
  delay: 5_000,
};

export const screeningQueueDefaultJobOptions = {
  attempts: SCREENING_JOB_ATTEMPTS,
  backoff: SCREENING_JOB_BACKOFF,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
