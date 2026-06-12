import { Router, type IRouter, type RequestHandler } from 'express';

import { requireAuth } from '../../middleware/require-auth';
import { uploadCandidateCreate } from '../../middleware/upload-candidate-create';
import { validate } from '../../lib/validate';
import {
  candidateIdParamsSchema,
  candidateListQuerySchema,
  importCandidatesBodySchema,
  updateCandidateBodySchema,
} from './candidates.dto';
import type { CandidatesController } from './candidates.controller';

export class CandidatesRouter {
  readonly router: IRouter;

  constructor(
    candidatesController: CandidatesController,
    requireOrganization: RequestHandler,
    rateLimitScreening: RequestHandler,
  ) {
    this.router = Router();
    const withOrganization = [requireAuth, requireOrganization];

    this.router.get(
      '/',
      ...withOrganization,
      validate({ query: candidateListQuerySchema }),
      candidatesController.list,
    );

    this.router.post(
      '/',
      ...withOrganization,
      rateLimitScreening,
      uploadCandidateCreate,
      candidatesController.create,
    );

    this.router.post(
      '/import',
      ...withOrganization,
      rateLimitScreening,
      validate({ body: importCandidatesBodySchema }),
      candidatesController.importCandidates,
    );

    this.router.get(
      '/:id',
      ...withOrganization,
      validate({ params: candidateIdParamsSchema }),
      candidatesController.getById,
    );

    this.router.get(
      '/:id/report',
      ...withOrganization,
      validate({ params: candidateIdParamsSchema }),
      candidatesController.getReport,
    );

    this.router.get(
      '/:id/export',
      ...withOrganization,
      validate({ params: candidateIdParamsSchema }),
      candidatesController.exportPdf,
    );

    this.router.patch(
      '/:id',
      ...withOrganization,
      validate({ params: candidateIdParamsSchema, body: updateCandidateBodySchema }),
      candidatesController.update,
    );

    this.router.post(
      '/:id/retry',
      ...withOrganization,
      rateLimitScreening,
      validate({ params: candidateIdParamsSchema }),
      candidatesController.retry,
    );
  }
}
