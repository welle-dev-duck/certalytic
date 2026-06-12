import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from './create-test-app';
import {
  expectApiError,
  registerVerifiedUser,
} from './helpers/auth-agent';
import {
  createOrganization,
  createTestOrganization,
  getOrganizationIdFromCreateResponse,
  uniqueOrganizationSlug,
} from './helpers/organization';
import { truncateAuthTables } from './helpers/db';
import { drainEmailQueue } from './helpers/queue';

describe('organizations (e2e)', () => {
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

  it('returns the active organization for authenticated members', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );
    const organization = createTestOrganization();
    organization.slug = uniqueOrganizationSlug();

    const created = await createOrganization(agent, organization);
    const organizationId = getOrganizationIdFromCreateResponse(created);

    const response = await agent.get('/api/organizations/active').expect(200);

    expect(response.body).toEqual({
      organization: {
        id: organizationId,
        name: organization.name,
        slug: organization.slug,
      },
      role: 'owner',
    });
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(testApp.app).get('/api/organizations/active');

    expectApiError(response, 401, 'UNAUTHORIZED');
  });

  it('rejects authenticated users without an active organization', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );

    const response = await agent.get('/api/organizations/active');

    expectApiError(response, 403, 'NO_ACTIVE_ORGANIZATION');
  });
});
