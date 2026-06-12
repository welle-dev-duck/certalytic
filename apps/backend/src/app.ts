import cors from 'cors';

import express, { type Express, type RequestHandler } from 'express';

import Redis from 'ioredis';



import { env } from './config/env';

import { db } from './db/index';

import { healthResponseSchema } from './dtos/common.dto';

import { sendJson } from './lib/response';

import { errorHandler } from './middleware/error-handler';

import { httpLogger } from './middleware/http-logger';

import { notFound } from './middleware/not-found';

import { requestId } from './middleware/request-id';

import { createRateLimit } from './middleware/rate-limit';

import { createSessionMiddleware } from './middleware/session';

import { requireAdmin } from './middleware/require-admin';

import { createRequireOrganization } from './middleware/require-organization';

import { Auth } from './modules/auth/auth';

import { AuthRouter } from './modules/auth/auth.router';

import { AuthService } from './modules/auth/auth.service';

import { BillingController } from './modules/billing/billing.controller';

import { BillingRouter } from './modules/billing/billing.router';

import { BillingService } from './modules/billing/billing.service';

import { PlanFeaturesService } from './modules/billing/plans';

import type { EmailsProducer } from './modules/emails/emails.producer';

import { RolesController } from './modules/roles/roles.controller';

import { RolesRouter } from './modules/roles/roles.router';

import { RolesService } from './modules/roles/roles.service';

import { CandidatesController } from './modules/candidates/candidates.controller';

import { CandidatesRouter } from './modules/candidates/candidates.router';

import { CandidatesService } from './modules/candidates/candidates.service';

import { ScreeningReportPdfExporter } from './modules/exports/screening-report-pdf.exporter';

import { RolesExportService } from './modules/roles/roles-export.service';

import type { RolesProducer } from './modules/roles/roles.producer';

import type { ScreeningProducer } from './modules/screening/screening.producer';

import { OrganizationsController } from './modules/organizations/organizations.controller';

import { OrganizationsRouter } from './modules/organizations/organizations.router';

import { OrganizationsService } from './modules/organizations/organizations.service';

import { UsersController } from './modules/users/users.controller';

import { UsersRouter } from './modules/users/users.router';

import { UsersService } from './modules/users/users.service';

import {

  NoopRealtimePublisher,

  type RealtimePublisher,

} from './realtime/publisher';

import {

  mountQueueDashboard,

  QUEUE_DASHBOARD_BASE_PATH,

} from './queues/dashboard';

import type { Queues } from './queues/queues';

import {

  createStorageClient,

  type StorageClient,

} from './storage/storage.client';



export type CreateAppDependencies = {

  emailsProducer: EmailsProducer;

  rolesProducer: RolesProducer;

  screeningProducer: ScreeningProducer;

  queues: Queues;

  storage?: StorageClient;

  realtimePublisher?: RealtimePublisher;

};



export type CreateAppResult = {

  app: Express;

  auth: Auth;

  organizationsService: OrganizationsService;

};



function createApiRateLimitMiddleware(

  rateLimitAuthenticated: RequestHandler,

): RequestHandler {

  return (req, res, next) => {

    if (

      req.path === '/api/health' ||

      req.path.startsWith('/api/auth') ||

      req.path === '/api/realtime'

    ) {

      next();

      return;

    }



    if (!req.path.startsWith('/api')) {

      next();

      return;

    }



    void rateLimitAuthenticated(req, res, next);

  };

}



export function createApp(deps: CreateAppDependencies): CreateAppResult {

  const app = express();

  const realtimePublisher =

    deps.realtimePublisher ?? new NoopRealtimePublisher();

  const redis = new Redis(env.REDIS_URL);

  const rateLimitAuthenticated = createRateLimit(redis, 'authenticated');

  const rateLimitScreening = createRateLimit(redis, 'screening');



  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(httpLogger);

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

  const planFeatures = new PlanFeaturesService(db);

  const billingService = new BillingService(db, planFeatures);

  const auth = new Auth(db, authService, billingService, deps.emailsProducer);

  const authRouter = new AuthRouter(auth);



  app.all('/api/auth/*splat', authRouter.handler);



  app.use(express.json({ limit: '2mb' }));

  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  app.use(createSessionMiddleware(auth));

  app.use(createApiRateLimitMiddleware(rateLimitAuthenticated));



  const usersService = new UsersService(db);

  const usersController = new UsersController(usersService);

  const usersRouter = new UsersRouter(usersController);



  app.use('/api/users', usersRouter.router);



  const organizationsService = new OrganizationsService(db);

  const requireOrganization = createRequireOrganization(
    organizationsService,
    authService,
  );

  const organizationsController = new OrganizationsController(

    organizationsService,

  );

  const organizationsRouter = new OrganizationsRouter(

    organizationsController,

    requireOrganization,

  );



  app.use('/api/organizations', organizationsRouter.router);



  const billingController = new BillingController(billingService);

  const billingRouter = new BillingRouter(billingController, requireOrganization);



  app.use('/api/billing', billingRouter.router);



  const storage = deps.storage ?? createStorageClient();

  const rolesService = new RolesService(

    db,

    planFeatures,

    storage,

    deps.rolesProducer,

  );

  const rolesExportService = new RolesExportService(

    db,

    storage,

    planFeatures,

    deps.screeningProducer,

    realtimePublisher,

  );

  const rolesController = new RolesController(rolesService, rolesExportService);

  const rolesRouter = new RolesRouter(rolesController, requireOrganization);



  app.use('/api/roles', rolesRouter.router);



  const candidatesService = new CandidatesService(

    db,

    planFeatures,

    billingService,

    deps.screeningProducer,

    storage,

    realtimePublisher,

  );

  const screeningReportPdfExporter = new ScreeningReportPdfExporter(

    planFeatures,

  );

  const candidatesController = new CandidatesController(

    candidatesService,

    screeningReportPdfExporter,

  );

  const candidatesRouter = new CandidatesRouter(

    candidatesController,

    requireOrganization,

    rateLimitScreening,

  );



  app.use('/api/candidates', candidatesRouter.router);



  mountQueueDashboard(app, deps.queues, [requireAdmin]);

  console.log(

    `Queue dashboard available at ${env.BASE_URL}${QUEUE_DASHBOARD_BASE_PATH}`,

  );



  app.use(notFound);

  app.use(errorHandler);



  return { app, auth, organizationsService };

}


