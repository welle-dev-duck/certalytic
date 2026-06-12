import { AppError } from '../../lib/errors';
import type { PlanFeaturesService } from '../billing/plans';
import type { CandidateDetailDto } from '../candidates/candidates.dto';
import { CandidateReportService } from '../candidates/candidate-report.service';
import { PdfDocumentBuilder } from './pdf-document-builder';
import { slugifyFilename } from './pdf-slug';

export class ScreeningReportPdfExporter {
  private readonly reportService = new CandidateReportService();

  constructor(private readonly planFeatures: PlanFeaturesService) {}

  async buildDownload(
    organizationId: string,
    candidate: CandidateDetailDto,
  ): Promise<{ buffer: Buffer; filename: string }> {
    if (candidate.status !== 'complete') {
      throw new AppError(
        'Integrity report is available only for completed screenings.',
        422,
        'CANDIDATE_NOT_COMPLETE',
      );
    }

    const watermarked = await this.planFeatures.can(
      organizationId,
      'watermarked_exports',
    );

    const report = this.reportService.build(candidate);
    const builder = await PdfDocumentBuilder.create({ watermarked });
    const generatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');

    builder.addBrandHeader(
      candidate.name,
      `${candidate.roleTitle ?? 'Role not specified'} · Generated ${generatedAt} UTC`,
    );

    if (candidate.roleTitle) {
      builder.addRoleSection(
        candidate.roleTitle,
        candidate.jobDescription ?? null,
      );
    }

    builder.addDisclaimer();
    builder.addCandidateReport(candidate.name, report, {
      email: candidate.email,
      linkedinUrl: candidate.linkedinUrl,
      githubUsername: candidate.githubUsername,
      followUpSuggested: candidate.followUpSuggested,
    });

    const buffer = await builder.build();

    return {
      buffer,
      filename: `${slugifyFilename(candidate.name)}-integrity-dossier.pdf`,
    };
  }
}
