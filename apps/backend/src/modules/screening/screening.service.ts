import { and, eq, gt, notInArray } from 'drizzle-orm';

import type { Database } from '../../db/index';
import {
  candidates,
  interviewRounds,
} from '../../db/schema/candidates.schema';
import { generateId } from '../../lib/id';
import type { PlanFeaturesService } from '../billing/plans';
import {
  NoopRealtimePublisher,
  type RealtimePublisher,
} from '../../realtime/publisher';
import type { ScreeningJob } from './dtos/screening-job.dto';
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
import { TranscriptIntegritySignalDetector } from './transcript-integrity-signal-detector';
import { TranscriptProcessor } from './transcript-processor';

export class ScreeningService {
  private readonly scoreCalculator = new IntegrityScoreCalculator();
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
  ) {}

  async process(job: ScreeningJob): Promise<void> {
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
        cvFormat: candidate.cvFormat as never,
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
        const existingFlags = Array.isArray(evaluation.flags)
          ? evaluation.flags
          : [];
        evaluation = {
          ...evaluation,
          flags: [...existingFlags, ...transcriptFlags],
        };
      }

      evaluation = this.evaluationReconciler.reconcile(
        evaluation,
        hasExternalProfiles,
      );

      const [roundInterviewScores, highInconsistency] =
        await this.syncVirtualInterviewRounds(candidate.id, evaluation);

      if (Object.keys(roundInterviewScores).length > 1) {
        const sInt = evaluation.s_int as { score: number };
        sInt.score = this.scoreCalculator.rollingInterviewScore(
          roundInterviewScores,
        );
        evaluation = { ...evaluation, s_int: sInt };
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
          followUpSuggested: Array.isArray(evaluation.follow_up_suggested)
            ? (evaluation.follow_up_suggested as string[])
            : [],
          highInconsistencyWarning: highInconsistency,
          processedAt: new Date(),
        })
        .where(eq(candidates.id, candidate.id));

      await this.realtimePublisher.candidateUpdated({
        candidateId: candidate.id,
        organizationId: candidate.organizationId,
        status: 'complete',
        errorMessage: null,
      });
    } catch (error) {
      console.error('Candidate screening failed', {
        candidateId: candidate.id,
        message: error instanceof Error ? error.message : String(error),
      });

      await this.db
        .update(candidates)
        .set({
          status: 'failed',
          errorMessage:
            'Screening could not be completed. Please try again.',
        })
        .where(eq(candidates.id, candidate.id));

      await this.realtimePublisher.candidateUpdated({
        candidateId: candidate.id,
        organizationId: candidate.organizationId,
        status: 'failed',
        errorMessage: 'Screening could not be completed. Please try again.',
      });

      throw error;
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

  private async syncVirtualInterviewRounds(
    candidateId: string,
    evaluation: Record<string, unknown>,
  ): Promise<[Record<number, number>, boolean]> {
    const roundAnalyses = Array.isArray(evaluation.round_analyses)
      ? [...(evaluation.round_analyses as Array<Record<string, unknown>>)].sort(
          (left, right) =>
            Number(left.round_number ?? 0) - Number(right.round_number ?? 0),
        )
      : [];

    if (roundAnalyses.length === 0) {
      return this.syncSingleInterviewRound(candidateId, evaluation);
    }

    const rounds = await this.db.query.interviewRounds.findMany({
      where: eq(interviewRounds.candidateId, candidateId),
      orderBy: (table, { asc }) => [asc(table.roundNumber)],
    });
    const mergedRound = rounds[0];
    let previousRoundScore: number | null = null;
    let highInconsistency = false;
    const roundInterviewScores: Record<number, number> = {};
    const activeRoundNumbers: number[] = [];

    for (const [index, roundAnalysis] of roundAnalyses.entries()) {
      const roundNumber = Number(roundAnalysis.round_number ?? index + 1);
      activeRoundNumbers.push(roundNumber);
      const sIntComponent = evaluation.s_int as { score: number };
      const sIdComponent = evaluation.s_id as { score: number };
      const roundIntScore = Number(roundAnalysis.s_int ?? sIntComponent.score);
      const roundIdScore = Number(roundAnalysis.s_id ?? sIdComponent.score);
      let varianceDelta: string | null = null;

      if (previousRoundScore !== null) {
        const delta = this.scoreCalculator.varianceDelta(
          previousRoundScore,
          roundIntScore,
        );

        if (this.scoreCalculator.hasHighInconsistency(delta)) {
          highInconsistency = true;
        }

        varianceDelta = delta.toFixed(2);
      }

      if (roundIntScore < 55) {
        highInconsistency = true;
      }

      const roundPayload = {
        roundScores: {
          s_int: roundIntScore,
          s_id: roundIdScore,
          observations: Array.isArray(roundAnalysis.observations)
            ? roundAnalysis.observations
            : [],
          anomalies: Array.isArray(roundAnalysis.anomalies)
            ? roundAnalysis.anomalies
            : evaluation.anomalies,
        },
        varianceDelta,
        deepDivePrompts:
          Array.isArray(roundAnalysis.deep_dive_prompts) &&
          roundAnalysis.deep_dive_prompts.length > 0
            ? roundAnalysis.deep_dive_prompts
            : roundNumber === 1
              ? evaluation.follow_up_suggested
              : null,
      };

      if (roundNumber === 1 && mergedRound) {
        await this.db
          .update(interviewRounds)
          .set({
            roundScores: roundPayload.roundScores,
            varianceDelta: roundPayload.varianceDelta,
            deepDivePrompts: roundPayload.deepDivePrompts as string[] | null,
          })
          .where(eq(interviewRounds.id, mergedRound.id));
      } else {
        const existing = rounds.find((round) => round.roundNumber === roundNumber);

        if (existing) {
          await this.db
            .update(interviewRounds)
            .set({
              transcriptText:
                existing.transcriptText ||
                '[Segment identified in merged transcript]',
              wasTruncated: mergedRound?.wasTruncated ?? false,
              interviewerNotes: null,
              roundScores: roundPayload.roundScores,
              varianceDelta: roundPayload.varianceDelta,
              deepDivePrompts: roundPayload.deepDivePrompts as
                | string[]
                | null,
            })
            .where(eq(interviewRounds.id, existing.id));
        } else {
          await this.db.insert(interviewRounds).values({
            id: generateId(),
            candidateId,
            roundNumber,
            transcriptText: '[Segment identified in merged transcript]',
            wasTruncated: mergedRound?.wasTruncated ?? false,
            interviewerNotes: null,
            roundScores: roundPayload.roundScores,
            varianceDelta: roundPayload.varianceDelta,
            deepDivePrompts: roundPayload.deepDivePrompts as string[] | null,
          });
        }
      }

      roundInterviewScores[roundNumber] = roundIntScore;
      previousRoundScore = roundIntScore;
    }

    if (activeRoundNumbers.length > 0) {
      await this.db
        .delete(interviewRounds)
        .where(
          and(
            eq(interviewRounds.candidateId, candidateId),
            gt(interviewRounds.roundNumber, 1),
            notInArray(interviewRounds.roundNumber, activeRoundNumbers),
          ),
        );
    }

    return [roundInterviewScores, highInconsistency];
  }

  private async syncSingleInterviewRound(
    candidateId: string,
    evaluation: Record<string, unknown>,
  ): Promise<[Record<number, number>, boolean]> {
    const round = await this.db.query.interviewRounds.findFirst({
      where: eq(interviewRounds.candidateId, candidateId),
      orderBy: (table, { asc }) => [asc(table.roundNumber)],
    });

    if (!round) {
      return [{}, false];
    }

    const sInt = evaluation.s_int as { score: number };
    const sId = evaluation.s_id as { score: number };
    const highInconsistency = sInt.score < 55;

    await this.db
      .update(interviewRounds)
      .set({
        roundScores: {
          s_int: sInt.score,
          s_id: sId.score,
          observations: [],
          anomalies: evaluation.anomalies,
        },
        varianceDelta: null,
        deepDivePrompts: Array.isArray(evaluation.follow_up_suggested)
          ? (evaluation.follow_up_suggested as string[])
          : [],
      })
      .where(eq(interviewRounds.id, round.id));

    return [{ [round.roundNumber]: sInt.score }, highInconsistency];
  }
}
