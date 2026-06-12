import { describe, expect, it } from 'vitest';

import {
  EMAIL_JOB_ATTEMPTS,
  EMAIL_JOB_BACKOFF,
  emailsQueueDefaultJobOptions,
} from './emails.queue-options';

describe('emailsQueueDefaultJobOptions', () => {
  it('retries failed jobs with exponential backoff', () => {
    expect(emailsQueueDefaultJobOptions).toEqual({
      attempts: EMAIL_JOB_ATTEMPTS,
      backoff: EMAIL_JOB_BACKOFF,
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    });
  });
});
