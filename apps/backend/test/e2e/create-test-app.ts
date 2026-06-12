import type { Express } from 'express';

import { createApp } from '../../src/app';
import { createContainer, type AppContainer } from '../../src/container';

export type TestApp = {
  app: Express;
  container: AppContainer;
  queues: AppContainer['queues'];
  close(): Promise<void>;
};

export async function createTestApp(): Promise<TestApp> {
  const container = createContainer({ startWorkers: false });
  const { app } = createApp(container);

  return {
    app,
    container,
    queues: container.queues,
    async close() {
      await container.close();
    },
  };
}
