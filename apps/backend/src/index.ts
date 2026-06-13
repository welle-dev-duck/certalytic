import 'dotenv/config';

import { createServer } from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { createContainer } from './container';
import { CandidateRetentionScheduler } from './modules/candidates/candidate-retention.scheduler';
import { logger } from './lib/logger';
import {
  captureException,
  flushSentry,
  initSentry,
} from './lib/sentry';
import { RealtimeSubscriber } from './realtime/subscriber';
import { RealtimeServer } from './realtime/ws.server';

initSentry();

const container = createContainer();
const candidateRetentionScheduler = new CandidateRetentionScheduler(
  container.candidateSensitiveDataService,
);
candidateRetentionScheduler.start();

const { app, auth, organizationsService } = createApp(container);

const server = createServer(app);
const realtimeServer = new RealtimeServer(server, auth, organizationsService);
const realtimeSubscriber = new RealtimeSubscriber(
  realtimeServer,
  container.subRedis,
);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, baseUrl: env.BASE_URL }, 'API listening');
  logger.info(
    { url: `${env.BASE_URL}/api/realtime` },
    'Realtime WebSocket available',
  );
});

async function shutdown(signal: string, exitCode = 0) {
  logger.info({ signal }, 'Shutting down');

  await realtimeSubscriber.close();
  await realtimeServer.close();
  candidateRetentionScheduler.stop();

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await container.close({ closeDb: true });
  await flushSentry();
  process.exit(exitCode);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT').catch((error) => {
    logger.error({ err: error }, 'Shutdown failed');
    process.exit(1);
  });
});
process.on('SIGTERM', () => {
  void shutdown('SIGTERM').catch((error) => {
    logger.error({ err: error }, 'Shutdown failed');
    process.exit(1);
  });
});
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  captureException(reason, { source: 'unhandledRejection' });
});
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  captureException(error, { source: 'uncaughtException' });

  void shutdown('uncaughtException', 1).catch((shutdownError) => {
    logger.error({ err: shutdownError }, 'Shutdown after uncaught exception failed');
    process.exit(1);
  });
});
