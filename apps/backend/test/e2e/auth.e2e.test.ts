import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import {
  createTestUser,
  registerVerifiedUser,
  signIn,
  signOut,
  signUp,
  verifyLatestEmail,
} from './helpers/auth-agent';
import { truncateAuthTables } from './helpers/db';
import { drainEmailQueue } from './helpers/queue';

describe('auth and session (e2e)', () => {
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

  it('signs up, verifies email, signs in, and exposes the session', async () => {
    const user = createTestUser();

    await signUp(testApp.app, user);
    await verifyLatestEmail(testApp.app, testApp.queues.emails);
    const agent = await signIn(testApp.app, user);

    const sessionResponse = await agent.get('/api/users/session').expect(200);

    expect(sessionResponse.body.session).toMatchObject({
      user: {
        email: user.email,
        name: user.name,
      },
    });
  });

  it('clears the session after sign out', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );

    await signOut(agent);

    const sessionResponse = await agent.get('/api/users/session').expect(200);
    expect(sessionResponse.body).toEqual({ session: null });
  });
});
