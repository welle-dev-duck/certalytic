import 'dotenv/config';

import { createServer } from 'node:http';

import { createApp } from './app';
import { env } from './config/env';
import { createContainer } from './container';
import { logger } from './lib/logger';
import { RealtimeSubscriber } from './realtime/subscriber';
import { RealtimeServer } from './realtime/ws.server';

const container = createContainer();
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

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');

  await realtimeSubscriber.close();
  await realtimeServer.close();

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
  process.exit(0);
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
