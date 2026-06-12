import cors from 'cors';
import express, { type Express } from 'express';

import { env } from './config/env';
import { db } from './db/index';
import { healthResponseSchema } from './dtos/common.dto';
import { sendJson } from './lib/response';
import { errorHandler } from './middleware/error-handler';
import { notFound } from './middleware/not-found';
import { createSessionMiddleware } from './middleware/session';
import { requireAdmin } from './middleware/require-admin';
import { Auth } from './modules/auth/auth';
import { AuthRouter } from './modules/auth/auth.router';
import { AuthService } from './modules/auth/auth.service';
import { BillingService } from './modules/billing/billing.service';
import type { EmailsProducer } from './modules/emails/emails.producer';
import {
  mountQueueDashboard,
  QUEUE_DASHBOARD_BASE_PATH,
} from './queues/dashboard';
import type { Queues } from './queues/queues';
import { UsersController } from './modules/users/users.controller';
import { UsersRouter } from './modules/users/users.router';
import { UsersService } from './modules/users/users.service';

export type CreateAppDependencies = {
  emailsProducer: EmailsProducer;
  queues: Queues;
};

export function createApp(deps: CreateAppDependencies): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: env.WEB_APP_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      credentials: true,
    }),
  );

  app.get('/api/health', (_req, res) => {
    sendJson(res, healthResponseSchema, { status: 'ok' });
  });

  const authService = new AuthService(db);
  const billingService = new BillingService(db);
  const auth = new Auth(db, authService, billingService, deps.emailsProducer);
  const authRouter = new AuthRouter(auth);

  // better-auth (+ Stripe webhooks) must be mounted before body parsers
  app.all('/api/auth/*splat', authRouter.handler);

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(createSessionMiddleware(auth));

  const usersService = new UsersService(db);
  const usersController = new UsersController(usersService);
  const usersRouter = new UsersRouter(usersController);

  app.use('/api/users', usersRouter.router);

  mountQueueDashboard(app, deps.queues, [requireAdmin]);
  console.log(
    `Queue dashboard available at ${env.BASE_URL}${QUEUE_DASHBOARD_BASE_PATH}`,
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
