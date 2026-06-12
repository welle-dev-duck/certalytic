import type { Request, Response } from 'express';

import { sendJson } from '../../lib/response';
import { getValidatedQuery } from '../../lib/validated-request';
import { ScreeningReportPdfExporter } from '../exports/screening-report-pdf.exporter';
import { CandidateReportService } from './candidate-report.service';
import {
  candidateDetailSchema,
  candidateListResponseSchema,
  candidateReportSchema,
  type CandidateListQueryDto,
  type UpdateCandidateBodyDto,
} from './candidates.dto';
import type { CandidatesService } from './candidates.service';

export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly candidateReportService: CandidateReportService,
    private readonly screeningReportPdfExporter: ScreeningReportPdfExporter,
  ) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const result = await this.candidatesService.list(
      req.organization!.id,
      getValidatedQuery<CandidateListQueryDto>(req),
    );

    sendJson(res, candidateListResponseSchema, result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const candidate = await this.candidatesService.getById(
      req.organization!.id,
      id,
    );

    sendJson(res, candidateDetailSchema, candidate);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.createCandidateInput!;

    req.log.info(
      {
        organizationId: req.organization!.id,
        roleId: input.role_id,
        hasCvFile: Boolean(input.cvFile),
        hasCvText: Boolean(input.cvText),
        transcriptLength: input.transcriptText.length,
      },
      'Creating candidate screening',
    );

    const candidate = await this.candidatesService.create(
      req.organization!.id,
      input,
    );

    req.log.info(
      { candidateId: candidate.id, organizationId: req.organization!.id },
      'Candidate screening created',
    );

    sendJson(res, candidateDetailSchema, candidate, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const candidate = await this.candidatesService.update(
      req.organization!.id,
      id,
      req.body as UpdateCandidateBodyDto,
    );

    sendJson(res, candidateDetailSchema, candidate);
  };

  retry = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const candidate = await this.candidatesService.retry(
      req.organization!.id,
      id,
    );

    sendJson(res, candidateDetailSchema, candidate);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await this.candidatesService.delete(req.organization!.id, id);
    res.status(204).send();
  };

  getReport = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const candidate = await this.candidatesService.getById(
      req.organization!.id,
      id,
    );
    const report = this.candidateReportService.build(candidate);

    sendJson(res, candidateReportSchema, report);
  };

  exportPdf = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const candidate = await this.candidatesService.getById(
      req.organization!.id,
      id,
    );
    const download = await this.screeningReportPdfExporter.buildDownload(
      req.organization!.id,
      candidate,
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.filename}"`,
    );
    res.send(download.buffer);
  };
}
