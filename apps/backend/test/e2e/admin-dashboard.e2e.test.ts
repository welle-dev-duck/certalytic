import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import {
  createTestUser,
  expectApiError,
  registerVerifiedUser,
  signIn,
  signUp,
  verifyLatestEmail,
} from './helpers/auth-agent';
import { setUserRole, truncateAuthTables } from './helpers/db';
import { drainEmailQueue } from './helpers/queue';
import { ADMIN_ROLE } from '../../src/middleware/require-admin';
import { QUEUE_DASHBOARD_BASE_PATH } from '../../src/queues/dashboard';

describe('admin queue dashboard (e2e)', () => {
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

  it('rejects unauthenticated access', async () => {
    const response = await request(testApp.app).get(QUEUE_DASHBOARD_BASE_PATH);

    expectApiError(response, 401, 'UNAUTHORIZED');
  });

  it('rejects non-admin users', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );

    const response = await agent.get(QUEUE_DASHBOARD_BASE_PATH);

    expectApiError(response, 403, 'FORBIDDEN');
  });

  it('allows admin users to load the dashboard', async () => {
    const user = createTestUser('admin-dashboard');

    await signUp(testApp.app, user);
    await verifyLatestEmail(testApp.app, testApp.queues.emails);
    await setUserRole(user.email, ADMIN_ROLE);
    const agent = await signIn(testApp.app, user);

    const response = await agent.get(QUEUE_DASHBOARD_BASE_PATH).expect(200);

    expect(response.text).toContain('Bull Dashboard');
  });
});
