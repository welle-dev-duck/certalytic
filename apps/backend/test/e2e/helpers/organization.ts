import type { Express } from 'express';
import type { Agent } from 'supertest';

import { generateId } from '../../../src/lib/id';
import { createAgent } from './auth-agent';

export type TestOrganization = {
  name: string;
  slug: string;
};

export function createTestOrganization(suffix = Date.now().toString()): TestOrganization {
  return {
    name: `E2E Org ${suffix}`,
    slug: `e2e-org-${suffix}`,
  };
}

export async function createOrganization(
  agent: Agent,
  organization: TestOrganization,
) {
  const response = await agent
    .post('/api/auth/organization/create')
    .send({
      name: organization.name,
      slug: organization.slug,
    })
    .expect(200);

  return response.body;
}

export async function setActiveOrganization(agent: Agent, organizationId: string) {
  await agent
    .post('/api/auth/organization/set-active')
    .send({ organizationId })
    .expect(200);
}

export async function createOrganizationWithAgent(
  app: Express,
  organization = createTestOrganization(),
) {
  const agent = createAgent(app);
  const created = await createOrganization(agent, organization);

  return { agent, organization, created };
}

export function getOrganizationIdFromCreateResponse(
  body: Record<string, unknown>,
): string {
  const organization = body.organization ?? body.data ?? body;

  if (
    typeof organization === 'object' &&
    organization !== null &&
    'id' in organization &&
    typeof organization.id === 'string'
  ) {
    return organization.id;
  }

  throw new Error('Could not resolve organization id from create response');
}

export function uniqueOrganizationSlug(): string {
  return `e2e-org-${generateId()}`;
}
