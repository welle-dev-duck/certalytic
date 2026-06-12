import { and, desc, eq, gt, ilike, lt, or, sql } from 'drizzle-orm';

import type { Database } from '../../db/index';
import {
  candidates,
  interviewRounds,
  type CandidateStatus,
} from '../../db/schema/candidates.schema';
import { roles } from '../../db/schema/roles.schema';
import { AppError, NotFoundError } from '../../lib/errors';
import { generateId } from '../../lib/id';
import { logger } from '../../lib/logger';
import { limitTranscriptText } from '../../lib/text-content-limiter';
import { paginateByCursor } from '../../lib/pagination';
import type { BillingService } from '../billing/billing.service';
import type { PlanFeaturesService } from '../billing/plans';
import {
  NoopRealtimePublisher,
  type RealtimePublisher,
} from '../../realtime/publisher';
import type { ScreeningProducer } from '../screening/screening.producer';
import type { CreateCandidateInput } from './candidates-create.parser';
import type {
  CandidateDetailDto,
  CandidateListItemDto,
  CandidateListQueryDto,
  ImportCandidatesBodyDto,
  UpdateCandidateBodyDto,
} from './candidates.dto';
import type { StorageClient } from '../../storage/storage.client';
import { candidateCvPath } from '../../storage/storage.paths';

export class CandidatesService {
  constructor(
    private readonly db: Database,
    private readonly planFeatures: PlanFeaturesService,
    private readonly billingService: BillingService,
    private readonly screeningProducer: ScreeningProducer,
    private readonly storage: StorageClient,
    private readonly realtimePublisher: RealtimePublisher = new NoopRealtimePublisher(),
  ) {}

  async list(
    organizationId: string,
    query: CandidateListQueryDto,
  ): Promise<ReturnType<typeof paginateByCursor<CandidateListItemDto>>> {
    const filters = [eq(candidates.organizationId, organizationId)];

    if (query.role_id) {
      filters.push(eq(candidates.roleId, query.role_id));
    }

    if (query.status) {
      filters.push(eq(candidates.status, query.status));
    }

    if (query.search) {
      const term = `%${query.search}%`;
      filters.push(
        or(ilike(candidates.name, term), ilike(candidates.email, term))!,
      );
    }

    if (query.cursor) {
      filters.push(lt(candidates.id, query.cursor));
    }

    const whereClause = and(...filters);

    const rows = await this.db
      .select({
        id: candidates.id,
        name: candidates.name,
        email: candidates.email,
        roleId: candidates.roleId,
        roleTitle: roles.title,
        status: candidates.status,
        integrityScore: candidates.integrityScore,
        highInconsistencyWarning: candidates.highInconsistencyWarning,
        processedAt: candidates.processedAt,
        errorMessage: candidates.errorMessage,
        createdAt: candidates.createdAt,
        roundsCount: sql<number>`(
          select count(*)::int from ${interviewRounds}
          where ${interviewRounds.candidateId} = ${candidates.id}
        )`,
      })
      .from(candidates)
      .leftJoin(roles, eq(candidates.roleId, roles.id))
      .where(whereClause)
      .orderBy(desc(candidates.id))
      .limit(query.limit + 1);

    const items: CandidateListItemDto[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      roleId: row.roleId,
      roleTitle: row.roleTitle,
      status: row.status as CandidateStatus,
      integrityScore: row.integrityScore ? Number(row.integrityScore) : null,
      roundsCount: row.roundsCount,
      highInconsistencyWarning: row.highInconsistencyWarning,
      processedAt: row.processedAt,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
    }));

    return paginateByCursor(items, query.limit);
  }

  async getById(
    organizationId: string,
    candidateId: string,
  ): Promise<CandidateDetailDto> {
    const candidate = await this.db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, organizationId),
      ),
      with: {
        role: { columns: { title: true, description: true } },
        interviewRounds: {
          orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
        },
      },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    return this.toDetail(candidate);
  }

  async create(
    organizationId: string,
    input: CreateCandidateInput,
  ): Promise<CandidateDetailDto> {
    logger.debug(
      {
        organizationId,
        roleId: input.role_id,
        hasLinkedIn: Boolean(input.linkedinText || input.linkedinUrl),
        hasGithub: Boolean(input.githubUsername),
      },
      'Validating candidate create request',
    );

    await this.assertSavedRoles(organizationId);
    await this.assertCrossSourceFields(organizationId, input);

    const role = await this.db.query.roles.findFirst({
      where: and(
        eq(roles.id, input.role_id),
        eq(roles.organizationId, organizationId),
      ),
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (!(await this.billingService.canConsumeScreening(organizationId))) {
      throw new AppError(
        'Insufficient screening tokens.',
        402,
        'INSUFFICIENT_TOKENS',
      );
    }

    const candidateId = generateId();
    const roundId = generateId();
    let cvPath: string | null = null;

    await this.db.insert(candidates).values({
      id: candidateId,
      organizationId,
      roleId: input.role_id,
      name: input.name,
      email: input.email,
      roleTitle: role.title,
      jobDescription: role.description,
      cvText: input.cvText,
      cvPath: null,
      cvFormat: input.cvFormat,
      linkedinUrl: input.linkedinUrl,
      linkedinText: input.linkedinText,
      githubUsername: input.githubUsername,
      status: 'pending',
    });

    if (input.cvFile) {
      const extension = input.cvFile.originalname.split('.').pop() ?? 'pdf';
      cvPath = candidateCvPath(organizationId, candidateId, extension);

      await this.storage.putObject(cvPath, input.cvFile.buffer);

      await this.db
        .update(candidates)
        .set({ cvPath, cvText: null })
        .where(eq(candidates.id, candidateId));
    }

    await this.db.insert(interviewRounds).values({
      id: roundId,
      candidateId,
      roundNumber: 1,
      transcriptText: input.transcriptText,
      interviewerNotes: input.interviewerNotes,
    });

    await this.billingService.debitScreening(organizationId);
    await this.enqueueScreening(organizationId, candidateId);

    await this.realtimePublisher.candidateUpdated({
      candidateId,
      organizationId,
      status: 'pending',
      errorMessage: null,
    });

    return this.getById(organizationId, candidateId);
  }

  async importCandidates(
    organizationId: string,
    input: ImportCandidatesBodyDto,
  ): Promise<{ queued: number }> {
    await this.assertSavedRoles(organizationId);

    const role = await this.db.query.roles.findFirst({
      where: and(
        eq(roles.id, input.role_id),
        eq(roles.organizationId, organizationId),
      ),
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    let queued = 0;

    for (const row of input.rows) {
      if (!(await this.billingService.canConsumeScreening(organizationId))) {
        break;
      }

      const candidateId = generateId();

      await this.db.insert(candidates).values({
        id: candidateId,
        organizationId,
        roleId: input.role_id,
        name: row.name,
        email: row.email ?? null,
        cvText: 'CV pending manual review.',
        cvFormat: 'text',
        status: 'pending',
      });

      await this.db.insert(interviewRounds).values({
        id: generateId(),
        candidateId,
        roundNumber: 1,
        transcriptText: limitTranscriptText(row.transcript).text,
      });

      await this.billingService.debitScreening(organizationId);
      await this.enqueueScreening(organizationId, candidateId);
      queued += 1;
    }

    return { queued };
  }

  async update(
    organizationId: string,
    candidateId: string,
    input: UpdateCandidateBodyDto,
  ): Promise<CandidateDetailDto> {
    const updated = await this.db
      .update(candidates)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.email !== undefined ? { email: input.email } : {}),
      })
      .where(
        and(
          eq(candidates.id, candidateId),
          eq(candidates.organizationId, organizationId),
        ),
      )
      .returning({ id: candidates.id });

    if (updated.length === 0) {
      throw new NotFoundError('Candidate not found');
    }

    return this.getById(organizationId, candidateId);
  }

  async delete(organizationId: string, candidateId: string): Promise<void> {
    const candidate = await this.db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, candidateId),
        eq(candidates.organizationId, organizationId),
      ),
    });

    if (!candidate) {
      throw new NotFoundError('Candidate not found');
    }

    if (candidate.cvPath) {
      try {
        await this.storage.deleteObject(candidate.cvPath);
      } catch {
        // Best-effort storage cleanup; DB row is still removed.
      }
    }

    await this.db
      .delete(candidates)
      .where(
        and(
          eq(candidates.id, candidateId),
          eq(candidates.organizationId, organizationId),
        ),
      );
  }

  async retry(
    organizationId: string,
    candidateId: string,
  ): Promise<CandidateDetailDto> {
    const candidate = await this.getById(organizationId, candidateId);

    if (!(await this.billingService.canConsumeScreening(organizationId))) {
      throw new AppError(
        'Insufficient screening tokens.',
        402,
        'INSUFFICIENT_TOKENS',
      );
    }

    await this.db
      .delete(interviewRounds)
      .where(
        and(
          eq(interviewRounds.candidateId, candidateId),
          gt(interviewRounds.roundNumber, 1),
        ),
      );

    await this.db
      .update(candidates)
      .set({
        status: 'pending',
        integrityScore: null,
        scoreBreakdown: null,
        followUpSuggested: null,
        highInconsistencyWarning: false,
        errorMessage: null,
        processedAt: null,
      })
      .where(eq(candidates.id, candidateId));

    await this.billingService.debitScreening(organizationId);
    await this.enqueueScreening(organizationId, candidateId);

    return this.getById(organizationId, candidate.id);
  }

  private async enqueueScreening(
    organizationId: string,
    candidateId: string,
  ): Promise<void> {
    const usePriority = await this.planFeatures.can(
      organizationId,
      'priority_queue',
    );

    await this.screeningProducer.enqueueProcessCandidate(
      { candidateId },
      usePriority ? { priority: 1 } : undefined,
    );
  }

  private async assertSavedRoles(organizationId: string): Promise<void> {
    const allowed = await this.planFeatures.can(organizationId, 'saved_roles');

    if (!allowed) {
      throw new AppError('Saved roles are not available on this plan.', 403, 'PLAN_FEATURE_REQUIRED');
    }
  }

  private async assertCrossSourceFields(
    organizationId: string,
    input: CreateCandidateInput,
  ): Promise<void> {
    const hasCrossSource = Boolean(
      input.linkedinUrl || input.linkedinText || input.githubUsername,
    );

    if (!hasCrossSource) {
      return;
    }

    const canManual = await this.planFeatures.can(
      organizationId,
      'cross_source_manual',
    );
    const canFull = await this.planFeatures.can(
      organizationId,
      'cross_source',
    );

    if (!canManual && !canFull) {
      throw new AppError(
        'Cross-source checks are not available on this plan.',
        403,
        'PLAN_FEATURE_REQUIRED',
      );
    }
  }

  private toDetail(candidate: {
    id: string;
    name: string;
    email: string | null;
    roleId: string | null;
    jobDescription?: string | null;
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
      status: candidate.status as CandidateStatus,
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
