import { eq } from 'drizzle-orm';

import type { Database } from '../../db/index';
import {
  candidates,
  interviewRounds,
  parseCvFormat,
} from '../../db/schema/candidates.schema';
import type { BillingRefundProducer } from '../billing/billing-refund.producer';
import type { CandidateSensitiveDataService } from '../candidates/candidate-sensitive-data.service';
import type { PlanFeaturesService } from '../billing/plans';
import { logger } from '../../lib/logger';
import {
  NoopRealtimePublisher,
  type RealtimePublisher,
} from '../../realtime/publisher';
import type { ProcessCandidateJob } from './dtos/screening-job.dto';
import {
  CandidateEvaluator,
  type PublicProfiles,
} from './candidate-evaluator';
import type { PublicProfileFetcher } from './public-profile-fetcher';
import { CvContentResolver } from './cv-content-resolver';
import { IntegrityEvaluationReconciler } from './integrity-evaluation-reconciler';
import { IntegrityScoreCalculator } from './integrity-score';
import { MistralInputBudgeter } from './mistral-input-budgeter';
import { RoleContextResolver } from './role-context-resolver';
import { ScreeningRoundSync } from './screening-round-sync';
import {
  buildEvaluationLanguageInstruction,
  parseOrganizationLanguage,
} from './organization-language';
import { TranscriptIntegritySignalDetector } from './transcript-integrity-signal-detector';
import { TranscriptProcessor } from './transcript-processor';

export class ScreeningService {
  private readonly scoreCalculator = new IntegrityScoreCalculator();
  private readonly roundSync: ScreeningRoundSync;
  private readonly evaluationReconciler = new IntegrityEvaluationReconciler();
  private readonly transcriptProcessor = new TranscriptProcessor();
  private readonly transcriptSignalDetector =
    new TranscriptIntegritySignalDetector();
  private readonly inputBudgeter = new MistralInputBudgeter(
    this.transcriptProcessor,
  );

  constructor(
    private readonly db: Database,
    private readonly planFeatures: PlanFeaturesService,
    private readonly cvContentResolver: CvContentResolver,
    private readonly roleContextResolver: RoleContextResolver,
    private readonly candidateEvaluator: CandidateEvaluator,
    private readonly publicProfileFetcher: PublicProfileFetcher,
    private readonly realtimePublisher: RealtimePublisher = new NoopRealtimePublisher(),
    private readonly billingRefundProducer?: BillingRefundProducer,
    private readonly candidateSensitiveDataService?: CandidateSensitiveDataService,
  ) {
    this.roundSync = new ScreeningRoundSync(db, this.scoreCalculator);
  }

  async process(job: ProcessCandidateJob): Promise<void> {
    const candidate = await this.db.query.candidates.findFirst({
      where: eq(candidates.id, job.candidateId),
      with: {
        interviewRounds: {
          orderBy: (rounds, { asc }) => [asc(rounds.roundNumber)],
        },
      },
    });

    if (!candidate) {
      return;
    }

    await this.db
      .update(candidates)
      .set({ status: 'processing', errorMessage: null })
      .where(eq(candidates.id, candidate.id));

    await this.realtimePublisher.candidateUpdated({
      candidateId: candidate.id,
      organizationId: candidate.organizationId,
      status: 'processing',
      errorMessage: null,
    });

    try {
      const includeCrossSource = await this.shouldIncludeCrossSource(candidate);
      const publicProfiles = await this.resolvePublicProfiles(candidate);
      const cvText = await this.cvContentResolver.resolve({
        cvText: candidate.cvText,
        cvPath: candidate.cvPath,
        cvFormat: parseCvFormat(candidate.cvFormat),
      });
      const primaryRound = candidate.interviewRounds[0];
      const mergedTranscript = primaryRound?.transcriptText ?? '';
      const budgeted = this.inputBudgeter.budget(cvText, mergedTranscript);
      const roundPayloads = [];

      for (const round of candidate.interviewRounds) {
        const sourceText =
          round.roundNumber === 1
            ? budgeted.transcriptText
            : round.transcriptText;
        const processed = this.transcriptProcessor.process(sourceText);

        if (processed.wasTruncated) {
          await this.db
            .update(interviewRounds)
            .set({
              wasTruncated: true,
              transcriptText: processed.text,
            })
            .where(eq(interviewRounds.id, round.id));
        }

        roundPayloads.push({
          round_number: round.roundNumber,
          transcript: processed.text,
          interviewer_notes: round.interviewerNotes,
          was_truncated: processed.wasTruncated,
        });
      }

      const roleContext = await this.roleContextResolver.resolve({
        roleId: candidate.roleId,
        roleTitle: candidate.roleTitle,
        jobDescription: candidate.jobDescription,
      });

      let evaluation = await this.candidateEvaluator.evaluate(
        budgeted.cvText,
        roundPayloads,
        publicProfiles,
        includeCrossSource,
        roleContext,
        parseOrganizationLanguage(candidate.language),
      );

      const hasExternalProfiles = Boolean(
        publicProfiles.linkedin_url ||
          publicProfiles.linkedin_text ||
          publicProfiles.github_username ||
          publicProfiles.github_text,
      );
      const transcriptFlags =
        this.transcriptSignalDetector.detect(mergedTranscript);

      if (transcriptFlags.length > 0) {
        evaluation = {
          ...evaluation,
          flags: [...evaluation.flags, ...transcriptFlags],
        };
      }

      evaluation = this.evaluationReconciler.reconcile(
        evaluation,
        hasExternalProfiles,
      );

      const [roundInterviewScores, highInconsistency] =
        await this.roundSync.sync(candidate.id, evaluation);

      if (Object.keys(roundInterviewScores).length > 1) {
        evaluation = {
          ...evaluation,
          s_int: {
            ...evaluation.s_int,
            score: this.scoreCalculator.rollingInterviewScore(
              roundInterviewScores,
            ),
          },
        };
      }

      const integrityScore = this.scoreCalculator.calculate(
        this.scoreCalculator.scoreComponentsFromEvaluation(evaluation),
      );

      await this.db
        .update(candidates)
        .set({
          status: 'complete',
          cvAnalysisResults: {
            extracted_text_preview: budgeted.cvText.slice(0, 500),
            public_profiles: publicProfiles,
          },
          integrityScore: integrityScore.toFixed(2),
          scoreBreakdown: evaluation,
          followUpSuggested: evaluation.follow_up_suggested,
          highInconsistencyWarning: highInconsistency,
          processedAt: new Date(),
        })
        .where(eq(candidates.id, candidate.id));

      await this.candidateSensitiveDataService?.eraseCandidateSensitiveData(
        candidate.id,
        candidate.organizationId,
      );

      await this.realtimePublisher.candidateUpdated({
        candidateId: candidate.id,
        organizationId: candidate.organizationId,
        status: 'complete',
        errorMessage: null,
      });
    } catch (error) {
      logger.warn(
        {
          err: error,
          candidateId: candidate.id,
          organizationId: candidate.organizationId,
        },
        'Candidate screening attempt failed',
      );

      throw error;
    }
  }

  async handlePermanentFailure(
    candidateId: string,
    error: unknown,
  ): Promise<void> {
    const candidate = await this.db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
    });

    if (!candidate) {
      return;
    }

    logger.error(
      {
        err: error,
        candidateId: candidate.id,
        organizationId: candidate.organizationId,
      },
      'Candidate screening failed after all retries',
    );

    await this.db
      .update(candidates)
      .set({
        status: 'failed',
        errorMessage: 'Screening could not be completed. Please try again.',
        failedAt: new Date(),
      })
      .where(eq(candidates.id, candidate.id));

    await this.realtimePublisher.candidateUpdated({
      candidateId: candidate.id,
      organizationId: candidate.organizationId,
      status: 'failed',
      errorMessage: 'Screening could not be completed. Please try again.',
    });

    if (!this.billingRefundProducer) {
      return;
    }

    try {
      await this.billingRefundProducer.enqueueScreeningRefund({
        organizationId: candidate.organizationId,
        candidateId: candidate.id,
        amount: 1,
      });
    } catch (refundError) {
      logger.error(
        {
          err: refundError,
          candidateId: candidate.id,
          organizationId: candidate.organizationId,
        },
        'Failed to enqueue screening token refund',
      );
    }
  }

  private async resolvePublicProfiles(candidate: {
    id: string;
    linkedinUrl: string | null;
    linkedinText: string | null;
    githubUsername: string | null;
    githubText: string | null;
  }): Promise<PublicProfiles> {
    let linkedinText = candidate.linkedinText;
    let githubText = candidate.githubText;

    const needsLinkedInFetch =
      Boolean(candidate.linkedinUrl?.trim()) && !linkedinText?.trim();
    const needsGitHubFetch =
      Boolean(candidate.githubUsername?.trim()) && !githubText?.trim();

    if (needsLinkedInFetch || needsGitHubFetch) {
      const fetched = await this.publicProfileFetcher.fetch(
        needsLinkedInFetch ? candidate.linkedinUrl : null,
        needsGitHubFetch ? candidate.githubUsername : null,
      );

      if (needsLinkedInFetch) {
        linkedinText = fetched.linkedin_text;
      }

      if (needsGitHubFetch) {
        githubText = fetched.github_text;
      }

      await this.db
        .update(candidates)
        .set({
          linkedinText,
          githubText,
        })
        .where(eq(candidates.id, candidate.id));
    }

    return {
      linkedin_url: candidate.linkedinUrl,
      github_username: candidate.githubUsername,
      linkedin_text: linkedinText,
      github_text: githubText,
    };
  }

  private async shouldIncludeCrossSource(candidate: {
    organizationId: string;
    linkedinText: string | null;
    linkedinUrl: string | null;
    githubUsername: string | null;
  }): Promise<boolean> {
    const canManual = await this.planFeatures.can(
      candidate.organizationId,
      'cross_source_manual',
    );
    const canFull = await this.planFeatures.can(
      candidate.organizationId,
      'cross_source',
    );
    const hasProfile = Boolean(
      candidate.linkedinText ||
        candidate.linkedinUrl ||
        candidate.githubUsername,
    );

    return (canManual || canFull) && hasProfile;
  }
}
