import 'dotenv/config';

import { createServer } from 'node:http';

import Redis from 'ioredis';

import { createApp } from './app';
import { env } from './config/env';
import { logger } from './lib/logger';
import { db } from './db/index';
import { createRedisConnection } from './lib/redis';
import { BillingRefundProducer } from './modules/billing/billing-refund.producer';
import { BillingRefundWorkers } from './modules/billing/billing-refund.worker';
import { BillingService } from './modules/billing/billing.service';
import { PlanFeaturesService } from './modules/billing/plans';
import { CandidateEvaluator } from './modules/screening/candidate-evaluator';
import { CvContentResolver } from './modules/screening/cv-content-resolver';
import { RoleContextResolver } from './modules/screening/role-context-resolver';
import { ScreeningProducer } from './modules/screening/screening.producer';
import { HttpPublicProfileFetcher } from './modules/screening/public-profile-fetcher';
import { ScreeningService } from './modules/screening/screening.service';
import { ScreeningWorkers } from './modules/screening/screening.worker';
import { DocumentExtractor } from './modules/mistral/document-extractor';
import { MistralClient } from './modules/mistral/mistral.client';
import { EmailsProducer } from './modules/emails/emails.producer';
import { EmailsService } from './modules/emails/emails.service';
import { EmailsWorkers } from './modules/emails/emails.worker';
import { RolesDocumentService } from './modules/roles/roles-document.service';
import { RolesExportService } from './modules/roles/roles-export.service';
import { RolesProducer } from './modules/roles/roles.producer';
import { RolesWorkers } from './modules/roles/roles.worker';
import { Queues } from './queues/queues';
import { RedisRealtimePublisher } from './realtime/publisher';
import { RealtimeSubscriber } from './realtime/subscriber';
import { RealtimeServer } from './realtime/ws.server';
import { createStorageClient } from './storage/storage.client';

const redisConnection = createRedisConnection();
const queues = new Queues(redisConnection);
const emailsProducer = new EmailsProducer(queues.emails);
const rolesProducer = new RolesProducer(queues.roles);
const screeningProducer = new ScreeningProducer(queues.screening);
const billingRefundProducer = new BillingRefundProducer(queues.billingRefunds);
const realtimePublisher = new RedisRealtimePublisher(new Redis(env.REDIS_URL));
const emailsService = new EmailsService();
const emailsWorkers = new EmailsWorkers(redisConnection, emailsService);
const storage = createStorageClient();
const mistralClient = new MistralClient();
const documentExtractor = new DocumentExtractor(mistralClient, storage);
const rolesDocumentService = new RolesDocumentService(
  db,
  storage,
  documentExtractor,
);
const planFeatures = new PlanFeaturesService(db);
const rolesExportService = new RolesExportService(
  db,
  storage,
  planFeatures,
  screeningProducer,
  realtimePublisher,
);
const rolesWorkers = new RolesWorkers(redisConnection, rolesDocumentService);
const billingService = new BillingService(db, planFeatures);
const screeningService = new ScreeningService(
  db,
  planFeatures,
  new CvContentResolver(storage, documentExtractor),
  new RoleContextResolver(db),
  new CandidateEvaluator(mistralClient),
  new HttpPublicProfileFetcher(),
  realtimePublisher,
  billingRefundProducer,
);
const screeningWorkers = new ScreeningWorkers(
  redisConnection,
  screeningService,
  rolesExportService,
);
const billingRefundWorkers = new BillingRefundWorkers(
  redisConnection,
  billingService,
);

const { app, auth, organizationsService } = createApp({
  emailsProducer,
  rolesProducer,
  screeningProducer,
  queues,
  storage,
  realtimePublisher,
});

const server = createServer(app);
const realtimeServer = new RealtimeServer(server, auth, organizationsService);
const realtimeSubscriber = new RealtimeSubscriber(realtimeServer);

server.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, baseUrl: env.BASE_URL },
    'API listening',
  );
  logger.info(
    { url: `${env.BASE_URL}/api/realtime` },
    'Realtime WebSocket available',
  );
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  await realtimeSubscriber.close();
  await realtimeServer.close();
  await emailsWorkers.close();
  await rolesWorkers.close();
  await screeningWorkers.close();
  await billingRefundWorkers.close();
  await queues.close();
  server.close();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
