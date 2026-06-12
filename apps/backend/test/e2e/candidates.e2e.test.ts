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

const sampleCvText =
  'Senior software engineer with ten years of experience building APIs, data pipelines, and screening workflows across Node.js and PostgreSQL.';
const sampleTranscript = `Interviewer: Tell me about your recent backend work.
Candidate: I led migration of our screening service from Laravel to Express.`;

describe('candidates (e2e)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAuthTables();
    await drainEmailQueue(testApp.queues.emails);
    await testApp.queues.screening.obliterate({ force: true });
  });

  afterAll(async () => {
    await testApp.close();
  });

  async function createRole(agent: request.SuperAgentTest) {
    const response = await agent
      .post('/api/roles')
      .send({
        title: 'Backend Engineer',
        description: 'Build APIs and screening workflows.',
      })
      .expect(201);

    return response.body.id as string;
  }

  it('creates, lists, and fetches a candidate with manual form data', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );
    const organization = createTestOrganization();
    organization.slug = uniqueOrganizationSlug();

    await createOrganization(agent, organization);
    const roleId = await createRole(agent);

    const createResponse = await agent
      .post('/api/candidates')
      .field('name', 'Jane Candidate')
      .field('email', 'jane@example.com')
      .field('role_id', roleId)
      .field('cv_input_mode', 'manual')
      .field('cv_text', sampleCvText)
      .field('transcript_input_mode', 'manual')
      .field('transcripts[0]', sampleTranscript)
      .expect(201);

    expect(createResponse.body).toMatchObject({
      name: 'Jane Candidate',
      email: 'jane@example.com',
      roleId,
      status: 'pending',
      roundsCount: 1,
    });

    const listResponse = await agent.get('/api/candidates?limit=25').expect(200);

    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0]).toMatchObject({
      id: createResponse.body.id,
      name: 'Jane Candidate',
      status: 'pending',
    });

    const detailResponse = await agent
      .get(`/api/candidates/${createResponse.body.id}`)
      .expect(200);

    expect(detailResponse.body.id).toBe(createResponse.body.id);
    expect(detailResponse.body.rounds).toHaveLength(1);

    const screeningJobs = await testApp.queues.screening.getJobs([
      'waiting',
      'delayed',
      'active',
    ]);
    expect(screeningJobs).toHaveLength(1);
    expect(screeningJobs[0]?.data).toEqual({
      candidateId: createResponse.body.id,
    });
  });

  it('creates a candidate with uploaded cv and vtt transcript files', async () => {
    const { agent } = await registerVerifiedUser(
      testApp.app,
      testApp.queues.emails,
    );
    const organization = createTestOrganization();
    organization.slug = uniqueOrganizationSlug();

    await createOrganization(agent, organization);
    const roleId = await createRole(agent);

    const vtt = `WEBVTT

00:00:01.000 --> 00:00:04.000
Interviewer: Hello.

00:00:05.000 --> 00:00:08.000
Candidate: Hi there.`;

    const createResponse = await agent
      .post('/api/candidates')
      .field('name', 'File Upload Candidate')
      .field('role_id', roleId)
      .field('cv_input_mode', 'auto')
      .field('transcript_input_mode', 'auto')
      .attach('cv', Buffer.from('%PDF-1.4 fake pdf content for test'), {
        filename: 'cv.pdf',
        contentType: 'application/pdf',
      })
      .attach('transcript_files', Buffer.from(vtt), {
        filename: 'interview.vtt',
        contentType: 'text/vtt',
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      name: 'File Upload Candidate',
      roleId,
      status: 'pending',
      roundsCount: 1,
    });
  });

  it('rejects unauthenticated candidate requests', async () => {
    const response = await request(testApp.app).get('/api/candidates');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
