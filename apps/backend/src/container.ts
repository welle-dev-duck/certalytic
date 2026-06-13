import Redis from 'ioredis';
import type { Pool } from 'pg';

import { env } from './config/env';
import { db, pool } from './db/index';
import type { Database } from './db/index';
import { logger } from './lib/logger';
import { createRedisConnection } from './lib/redis';
import { BillingRefundProducer } from './modules/billing/billing-refund.producer';
import { BillingRefundWorkers } from './modules/billing/billing-refund.worker';
import { BillingService } from './modules/billing/billing.service';
import { PlanFeaturesService } from './modules/billing/plans';
import { CandidateSensitiveDataService } from './modules/candidates/candidate-sensitive-data.service';
import { CandidateReportService } from './modules/candidates/candidate-report.service';
import { EmailsProducer } from './modules/emails/emails.producer';
import { EmailsService } from './modules/emails/emails.service';
import { EmailsWorkers } from './modules/emails/emails.worker';
import { DocumentExtractor } from './modules/mistral/document-extractor';
import { MistralClient } from './modules/mistral/mistral.client';
import { RolesDocumentService } from './modules/roles/roles-document.service';
import { RoleExportsProducer } from './modules/roles/role-exports.producer';
import { RoleExportsWorkers } from './modules/roles/role-exports.worker';
import { RolesExportService } from './modules/roles/roles-export.service';
import { RolesProducer } from './modules/roles/roles.producer';
import { RolesWorkers } from './modules/roles/roles.worker';
import { CandidateEvaluator } from './modules/screening/candidate-evaluator';
import { CvContentResolver } from './modules/screening/cv-content-resolver';
import { HttpPublicProfileFetcher } from './modules/screening/public-profile-fetcher';
import { RoleContextResolver } from './modules/screening/role-context-resolver';
import { ScreeningProducer } from './modules/screening/screening.producer';
import { ScreeningService } from './modules/screening/screening.service';
import { ScreeningWorkers } from './modules/screening/screening.worker';
import { Queues } from './queues/queues';
import {
  RedisRealtimePublisher,
  type RealtimePublisher,
} from './realtime/publisher';
import { createStorageClient, type StorageClient } from './storage/storage.client';

export type AppContainer = {
  db: Database;
  pool: Pool;
  redis: Redis;
  pubRedis: Redis;
  subRedis: Redis;
  storage: StorageClient;
  queues: Queues;
  planFeatures: PlanFeaturesService;
  billingService: BillingService;
  realtimePublisher: RealtimePublisher;
  emailsProducer: EmailsProducer;
  rolesProducer: RolesProducer;
  screeningProducer: ScreeningProducer;
  roleExportsProducer: RoleExportsProducer;
  billingRefundProducer: BillingRefundProducer;
  candidateReportService: CandidateReportService;
  candidateSensitiveDataService: CandidateSensitiveDataService;
  rolesExportService: RolesExportService;
  screeningService: ScreeningService;
  rolesDocumentService: RolesDocumentService;
  emailsService: EmailsService;
  emailsWorkers: EmailsWorkers | null;
  rolesWorkers: RolesWorkers | null;
  screeningWorkers: ScreeningWorkers | null;
  roleExportsWorkers: RoleExportsWorkers | null;
  billingRefundWorkers: BillingRefundWorkers | null;
  close(options?: { closeDb?: boolean }): Promise<void>;
};

export type CreateContainerOptions = {
  startWorkers?: boolean;
};

export function createContainer(
  options: CreateContainerOptions = {},
): AppContainer {
  const { startWorkers = true } = options;
  const redisConnection = createRedisConnection();
  const redis = new Redis(env.REDIS_URL);
  const pubRedis = new Redis(env.REDIS_URL);
  const subRedis = new Redis(env.REDIS_URL);

  const queues = new Queues(redisConnection);
  const planFeatures = new PlanFeaturesService(db);
  const billingService = new BillingService(db, planFeatures);
  const storage = createStorageClient();
  const realtimePublisher = new RedisRealtimePublisher(pubRedis);
  const mistralClient = new MistralClient();
  const documentExtractor = new DocumentExtractor(mistralClient, storage);

  const emailsProducer = new EmailsProducer(queues.emails);
  const rolesProducer = new RolesProducer(queues.roles);
  const screeningProducer = new ScreeningProducer(queues.screening);
  const roleExportsProducer = new RoleExportsProducer(queues.roleExports);
  const billingRefundProducer = new BillingRefundProducer(queues.billingRefunds);

  const rolesDocumentService = new RolesDocumentService(
    db,
    storage,
    documentExtractor,
  );
  const candidateReportService = new CandidateReportService();
  const candidateSensitiveDataService = new CandidateSensitiveDataService(
    db,
    storage,
  );
  const rolesExportService = new RolesExportService(
    db,
    storage,
    planFeatures,
    roleExportsProducer,
    realtimePublisher,
    candidateReportService,
  );
  const screeningService = new ScreeningService(
    db,
    planFeatures,
    new CvContentResolver(storage, documentExtractor),
    new RoleContextResolver(db),
    new CandidateEvaluator(mistralClient),
    new HttpPublicProfileFetcher(),
    realtimePublisher,
    billingRefundProducer,
    candidateSensitiveDataService,
  );

  const emailsService = new EmailsService();
  const emailsWorkers = startWorkers
    ? new EmailsWorkers(redisConnection, emailsService)
    : null;
  const rolesWorkers = startWorkers
    ? new RolesWorkers(redisConnection, rolesDocumentService)
    : null;
  const screeningWorkers = startWorkers
    ? new ScreeningWorkers(redisConnection, screeningService)
    : null;
  const roleExportsWorkers = startWorkers
    ? new RoleExportsWorkers(redisConnection, rolesExportService)
    : null;
  const billingRefundWorkers = startWorkers
    ? new BillingRefundWorkers(redisConnection, billingService)
    : null;

  return {
    db,
    pool,
    redis,
    pubRedis,
    subRedis,
    storage,
    queues,
    planFeatures,
    billingService,
    realtimePublisher,
    emailsProducer,
    rolesProducer,
    screeningProducer,
    roleExportsProducer,
    billingRefundProducer,
    candidateReportService,
    candidateSensitiveDataService,
    rolesExportService,
    screeningService,
    rolesDocumentService,
    emailsService,
    emailsWorkers,
    rolesWorkers,
    screeningWorkers,
    roleExportsWorkers,
    billingRefundWorkers,
    async close(options?: { closeDb?: boolean }) {
      await Promise.all(
        [
          emailsWorkers?.close(),
          rolesWorkers?.close(),
          screeningWorkers?.close(),
          roleExportsWorkers?.close(),
          billingRefundWorkers?.close(),
        ].filter(Boolean),
      );

      await queues.close();
      await Promise.all([redis.quit(), pubRedis.quit(), subRedis.quit()]);

      if (options?.closeDb) {
        await pool.end();
      }
    },
  };
}

export async function closeContainer(
  container: AppContainer,
  options?: { closeDb?: boolean },
): Promise<void> {
  await container.close(options);
  logger.debug('Application container closed');
}
