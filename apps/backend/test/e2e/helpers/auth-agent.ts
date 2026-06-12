import type { Queue } from 'bullmq';
import type { Express } from 'express';
import type { Response } from 'supertest';
import request from 'supertest';
import { expect } from 'vitest';

import { extractTokenFromVerificationUrl, getEmailJobs } from './queue';

export type TestUser = {
  email: string;
  password: string;
  name: string;
};

export function createAgent(app: Express) {
  return request.agent(app);
}

export function createTestUser(suffix = Date.now().toString()): TestUser {
  return {
    email: `e2e-${suffix}@example.com`,
    password: 'password123',
    name: 'E2E User',
  };
}

export async function signUp(app: Express, user: TestUser) {
  const agent = createAgent(app);

  const response = await agent
    .post('/api/auth/sign-up/email')
    .send(user)
    .expect(200);

  return { agent, response };
}

export async function verifyLatestEmail(app: Express, queue: Queue) {
  const jobs = await getEmailJobs(queue);
  const verificationJob = jobs.find((job) => job.type === 'verification');

  if (!verificationJob || verificationJob.type !== 'verification') {
    throw new Error('No verification job found in the email queue');
  }

  const token = extractTokenFromVerificationUrl(verificationJob.url);
  const agent = createAgent(app);

  await agent.get('/api/auth/verify-email').query({ token }).expect(200);

  return agent;
}

export async function signIn(app: Express, user: TestUser) {
  const agent = createAgent(app);

  await agent
    .post('/api/auth/sign-in/email')
    .send({ email: user.email, password: user.password })
    .expect(200);

  return agent;
}

export async function signOut(agent: ReturnType<typeof createAgent>) {
  await agent.post('/api/auth/sign-out').expect(200);
}

export async function registerVerifiedUser(
  app: Express,
  queue: Queue,
  user = createTestUser(),
) {
  await signUp(app, user);
  await verifyLatestEmail(app, queue);
  const agent = await signIn(app, user);

  return { agent, user };
}

export function expectApiError(
  response: Response,
  statusCode: number,
  code: string,
) {
  expect(response.status).toBe(statusCode);
  expect(response.body).toEqual({
    error: expect.objectContaining({ code }),
  });
}
