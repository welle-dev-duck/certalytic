import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import { registerVerifiedUser } from './helpers/auth-agent';
import { truncateAuthTables } from './helpers/db';
import {
  createOrganization,
  createTestOrganization,
  uniqueOrganizationSlug,
} from './helpers/organization';
import { drainEmailQueue } from './helpers/queue';

describe('roles (e2e)', () => {
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

  it('creates and lists roles for the active organization', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );
    const organization = createTestOrganization();
    organization.slug = uniqueOrganizationSlug();

    await createOrganization(agent, organization);

    const createResponse = await agent
      .post('/api/roles')
      .send({
        title: 'Senior Backend Engineer',
        description: 'Own screening workflows and APIs.',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      title: 'Senior Backend Engineer',
      description: 'Own screening workflows and APIs.',
      candidatesCount: 0,
      documents: [],
      stats: {
        avgIntegrity: null,
        scored: 0,
        distribution: { high: 0, medium: 0, low: 0 },
      },
    });

    const listResponse = await agent.get('/api/roles?limit=25').expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      id: createResponse.body.id,
      title: 'Senior Backend Engineer',
    });
    expect(listResponse.body.pagination).toMatchObject({
      limit: 25,
      hasNextPage: false,
      hasPrevPage: false,
      nextCursor: null,
    });
  });

  it('rejects unauthenticated role requests', async () => {
    const response = await request(testApp.app).get('/api/roles');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
