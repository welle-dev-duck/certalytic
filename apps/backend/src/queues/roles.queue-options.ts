export const ROLES_JOB_ATTEMPTS = 5;

export const ROLES_JOB_BACKOFF = {
  type: 'exponential' as const,
  delay: 5_000,
};

export const rolesQueueDefaultJobOptions = {
  attempts: ROLES_JOB_ATTEMPTS,
  backoff: ROLES_JOB_BACKOFF,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};
