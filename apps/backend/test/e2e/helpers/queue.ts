import type { Queue } from 'bullmq';

import { emailJobSchema } from '../../../src/modules/emails/dtos/email-job.dto';

export async function drainEmailQueue(queue: Queue) {
  await queue.obliterate({ force: true });
}

export async function getEmailJobs(queue: Queue) {
  const jobs = await queue.getJobs([
    'waiting',
    'delayed',
    'active',
    'completed',
    'failed',
  ]);

  return jobs.map((job) => emailJobSchema.parse(job.data));
}

export function extractTokenFromVerificationUrl(url: string): string {
  const parsed = new URL(url);
  const token = parsed.searchParams.get('token');

  if (!token) {
    throw new Error(`Verification URL did not include a token: ${url}`);
  }

  return token;
}
