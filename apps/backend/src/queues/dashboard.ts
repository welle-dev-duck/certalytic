import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Express, RequestHandler } from 'express';

import type { Queues } from './queues';

export const QUEUE_DASHBOARD_BASE_PATH = '/admin/queues';

export function mountQueueDashboard(
  app: Express,
  queues: Queues,
  middleware: RequestHandler[] = [],
): void {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath(QUEUE_DASHBOARD_BASE_PATH);

  createBullBoard({
    queues: queues.all().map((queue) => new BullMQAdapter(queue)),
    serverAdapter,
  });

  app.use(
    QUEUE_DASHBOARD_BASE_PATH,
    ...middleware,
    serverAdapter.getRouter(),
  );
}
