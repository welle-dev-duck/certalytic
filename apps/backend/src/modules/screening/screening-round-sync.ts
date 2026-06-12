import { and, eq, gt, notInArray } from 'drizzle-orm';

import type { Database } from '../../db/index';
import { interviewRounds } from '../../db/schema/candidates.schema';
import { generateId } from '../../lib/id';
import type { ScreeningEvaluation } from './dtos/screening-evaluation.dto';
import type { IntegrityScoreCalculator } from './integrity-score';

export class ScreeningRoundSync {
  constructor(
    private readonly db: Database,
    private readonly scoreCalculator: IntegrityScoreCalculator,
  ) {}

  async sync(
    candidateId: string,
    evaluation: ScreeningEvaluation,
  ): Promise<[Record<number, number>, boolean]> {
    const roundAnalyses = [...evaluation.round_analyses].sort(
      (left, right) => left.round_number - right.round_number,
    );

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
      const roundNumber = roundAnalysis.round_number || index + 1;
      activeRoundNumbers.push(roundNumber);
      const roundIntScore = roundAnalysis.s_int;
      const roundIdScore = roundAnalysis.s_id;
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
          observations: roundAnalysis.observations,
          anomalies:
            roundAnalysis.anomalies.length > 0
              ? roundAnalysis.anomalies
              : evaluation.anomalies,
        },
        varianceDelta,
        deepDivePrompts:
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
            deepDivePrompts: roundPayload.deepDivePrompts,
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
              deepDivePrompts: roundPayload.deepDivePrompts,
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
            deepDivePrompts: roundPayload.deepDivePrompts,
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
    evaluation: ScreeningEvaluation,
  ): Promise<[Record<number, number>, boolean]> {
    const round = await this.db.query.interviewRounds.findFirst({
      where: eq(interviewRounds.candidateId, candidateId),
      orderBy: (table, { asc }) => [asc(table.roundNumber)],
    });

    if (!round) {
      return [{}, false];
    }

    const sIntScore = evaluation.s_int.score ?? 0;
    const sIdScore = evaluation.s_id.score ?? 0;
    const highInconsistency = sIntScore < 55;

    await this.db
      .update(interviewRounds)
      .set({
        roundScores: {
          s_int: sIntScore,
          s_id: sIdScore,
          observations: [],
          anomalies: evaluation.anomalies,
        },
        varianceDelta: null,
        deepDivePrompts: evaluation.follow_up_suggested,
      })
      .where(eq(interviewRounds.id, round.id));

    return [{ [round.roundNumber]: sIntScore }, highInconsistency];
  }
}
