import 'dotenv/config';

import { createApp } from './app';
import { env } from './config/env';
import { createRedisConnection } from './lib/redis';
import { EmailsProducer } from './modules/emails/emails.producer';
import { EmailsService } from './modules/emails/emails.service';
import { EmailsWorkers } from './modules/emails/emails.worker';
import { Queues } from './queues/queues';

const redisConnection = createRedisConnection();
const queues = new Queues(redisConnection);
const emailsProducer = new EmailsProducer(queues.emails);
const emailsService = new EmailsService();
const emailsWorkers = new EmailsWorkers(redisConnection, emailsService);

const app = createApp({ emailsProducer, queues });

app.listen(env.PORT, () => {
  console.log(`API listening on ${env.BASE_URL} (port ${env.PORT})`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`);
  await emailsWorkers.close();
  await queues.close();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
