import type { Express } from 'express';

import { createApp } from '../../src/app';
import { createRedisConnection } from '../../src/lib/redis';
import { EmailsProducer } from '../../src/modules/emails/emails.producer';
import { Queues } from '../../src/queues/queues';

export async function createTestApp() {
  const redisConnection = createRedisConnection();
  const queues = new Queues(redisConnection);
  const emailsProducer = new EmailsProducer(queues.emails);
  const app = createApp({ emailsProducer, queues });

  return {
    app,
    queues,
    emailsProducer,
    async close() {
      await queues.close();
    },
  };
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;
