import { and, desc, eq } from 'drizzle-orm';

import { env } from '../../config/env';
import type { Database } from '../../db/index';
import { candidates } from '../../db/schema/candidates.schema';
import type { RoleExportStatus } from '../../db/schema/roles.schema';
import { roles } from '../../db/schema/roles.schema';
import type { StorageClient } from '../../storage/storage.client';
import { roleExportPath } from '../../storage/storage.paths';
import type { PlanFeaturesService } from '../billing/plans';
import { CandidateReportService } from '../candidates/candidate-report.service';
import type { CandidateDetailDto } from '../candidates/candidates.dto';
import { PdfDocumentBuilder } from './pdf-document-builder';

type RoleExportRecord = {
  id: string;
  organizationId: string;
  roleId: string;
  status: RoleExportStatus;
};

export class RoleExportPdfGenerator {
  private readonly reportService = new CandidateReportService();

  constructor(
    private readonly db: Database,
    private readonly storage: StorageClient,
    private readonly planFeatures: PlanFeaturesService,
  ) {}

  async store(exportRecord: RoleExportRecord): Promise<string> {
    const role = await this.db.query.roles.findFirst({
      where: and(
        eq(roles.id, exportRecord.roleId),
        eq(roles.organizationId, exportRecord.organizationId),
      ),
    });

    if (!role) {
      throw new Error('Role not found for export.');
    }

    const watermarked = await this.planFeatures.can(
      exportRecord.organizationId,
      'watermarked_exports',
    );

    const completedCandidates = await this.db.query.candidates.findMany({
      where: and(
        eq(candidates.roleId, role.id),
        eq(candidates.status, 'complete'),
      ),
      with: {
        role: { columns: { title: true, description: true } },
        interviewRounds: {
          orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
        },
      },
      orderBy: [desc(candidates.integrityScore), desc(candidates.name)],
    });

    const scored = completedCandidates.filter(
      (candidate) => candidate.integrityScore !== null,
    );
    const distribution = {
      high: scored.filter(
        (candidate) => Number(candidate.integrityScore) >= 75,
      ).length,
      medium: scored.filter((candidate) => {
        const score = Number(candidate.integrityScore);

        return score >= 50 && score < 75;
      }).length,
      low: scored.filter((candidate) => Number(candidate.integrityScore) < 50)
        .length,
    };

    const avgIntegrity =
      scored.length > 0
        ? scored.reduce(
            (sum, candidate) => sum + Number(candidate.integrityScore),
            0,
          ) / scored.length
        : null;

    const builder = await PdfDocumentBuilder.create({ watermarked });
    const generatedAt = new Date()
      .toISOString()
      .slice(0, 16)
      .replace('T', ' ');

    builder.addCoverHeader(role.title, `${generatedAt} UTC`, {
      candidatesScreened: completedCandidates.length,
    });
    builder.addRoleOverview(role.description, {
      avgIntegrity,
      scored: scored.length,
      completedCount: completedCandidates.length,
      distribution,
    });

    for (const candidate of completedCandidates) {
      const detail = this.toCandidateDetail(candidate);
      const report = this.reportService.build(detail);

      builder.startCandidatePage();
      builder.addCandidateReport(candidate.name, report, {
        email: detail.email,
        linkedinUrl: detail.linkedinUrl,
        githubUsername: detail.githubUsername,
        followUpSuggested: detail.followUpSuggested,
      });
    }

    builder.addClosingPage(env.WEB_APP_URL);
    const buffer = await builder.build();
    const path = roleExportPath(
      exportRecord.organizationId,
      exportRecord.roleId,
      exportRecord.id,
    );

    await this.storage.putObject(path, buffer, 'application/pdf');

    return path;
  }

  private toCandidateDetail(candidate: {
    id: string;
    name: string;
    email: string | null;
    roleId: string | null;
    jobDescription: string | null;
    role?: { title: string; description: string | null } | null;
    status: string;
    integrityScore: string | null;
    highInconsistencyWarning: boolean;
    processedAt: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    linkedinUrl: string | null;
    githubUsername: string | null;
    scoreBreakdown: Record<string, unknown> | null;
    followUpSuggested: string[] | null;
    interviewRounds: Array<{
      id: string;
      roundNumber: number;
      wasTruncated: boolean;
      varianceDelta: string | null;
      deepDivePrompts: string[] | null;
      roundScores: Record<string, unknown> | null;
    }>;
  }): CandidateDetailDto {
    return {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      roleId: candidate.roleId,
      roleTitle: candidate.role?.title ?? null,
      jobDescription:
        candidate.jobDescription ?? candidate.role?.description ?? null,
      status: candidate.status as CandidateDetailDto['status'],
      integrityScore: candidate.integrityScore
        ? Number(candidate.integrityScore)
        : null,
      roundsCount: candidate.interviewRounds.length,
      highInconsistencyWarning: candidate.highInconsistencyWarning,
      processedAt: candidate.processedAt,
      errorMessage: candidate.errorMessage,
      createdAt: candidate.createdAt,
      linkedinUrl: candidate.linkedinUrl,
      githubUsername: candidate.githubUsername,
      scoreBreakdown: candidate.scoreBreakdown,
      followUpSuggested: candidate.followUpSuggested,
      rounds: candidate.interviewRounds.map((round) => ({
        id: round.id,
        roundNumber: round.roundNumber,
        wasTruncated: round.wasTruncated,
        varianceDelta: round.varianceDelta ? Number(round.varianceDelta) : null,
        deepDivePrompts: round.deepDivePrompts,
        roundScores: round.roundScores,
      })),
    };
  }
}
