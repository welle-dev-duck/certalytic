import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import { truncateAuthTables } from './helpers/db';
import { drainEmailQueue } from './helpers/queue';

describe('health and routing (e2e)', () => {
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

  it('GET /api/health returns dependency checks', async () => {
    const response = await request(testApp.app).get('/api/health').expect(200);

    expect(response.body).toEqual({
      status: 'ok',
      checks: {
        database: {
          status: 'ok',
          latencyMs: expect.any(Number),
        },
        redis: {
          status: 'ok',
          latencyMs: expect.any(Number),
        },
      },
    });
  });

  it('returns a structured 404 for unknown routes', async () => {
    const response = await request(testApp.app)
      .get('/api/does-not-exist')
      .expect(404);

    expect(response.body).toEqual({
      error: {
        message: 'Not found',
        code: 'NOT_FOUND',
      },
    });
  });

  it('GET /api/users/session returns null without auth', async () => {
    const response = await request(testApp.app)
      .get('/api/users/session')
      .expect(200);

    expect(response.body).toEqual({ session: null });
  });
});
