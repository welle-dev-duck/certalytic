import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import { createTestUser, signUp } from './helpers/auth-agent';
import { truncateAuthTables } from './helpers/db';
import { drainEmailQueue, getEmailJobs } from './helpers/queue';

describe('email queue integration (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAuthTables();
    await drainEmailQueue(testApp.queues.emails);
  });

  afterAll(async () => {
    await testApp.close();
  });

  it('enqueues a verification email job on sign up', async () => {
    const user = createTestUser('queue-sign-up');

    await signUp(testApp.app, user);

    const jobs = await getEmailJobs(testApp.queues.emails);

    expect(jobs).toHaveLength(1);
    expect(jobs[0]).toMatchObject({
      type: 'verification',
      user: {
        email: user.email,
        name: user.name,
      },
    });
    expect(jobs[0]?.url).toContain('token=');
  });
});
