import type { CandidateDetailDto, CandidateReportDto } from './candidates.dto';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function level(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) {
    return 'high';
  }

  if (score >= 50) {
    return 'medium';
  }

  return 'low';
}

function subScore(
  breakdown: Record<string, unknown> | null | undefined,
  key: string,
  fallback: number,
): number {
  const component = breakdown?.[key];

  if (!component || typeof component !== 'object') {
    return fallback;
  }

  const score = (component as { score?: number | null }).score;

  return typeof score === 'number' ? clamp(score) : fallback;
}

export class CandidateReportService {
  build(candidate: CandidateDetailDto): CandidateReportDto {
    const score = clamp(candidate.integrityScore ?? 0);
    const breakdown = candidate.scoreBreakdown ?? undefined;
    const crossSourceEvaluated =
      subScore(breakdown, 's_cross', 0) > 0 ||
      (breakdown?.s_cross as { confidence_band?: string } | undefined)
        ?.confidence_band !== 'not-evaluated';

    const flags = Array.isArray(breakdown?.flags)
      ? (breakdown!.flags as Array<Record<string, unknown>>)
          .filter((flag) => typeof flag.description === 'string')
          .map((flag) => ({
            type: String(flag.type ?? 'interview_prompt'),
            severity: String(flag.severity ?? 'warning'),
            description: String(flag.description),
            confidence:
              typeof flag.confidence === 'number' ? flag.confidence : 0.75,
          }))
      : [];

    return {
      score,
      level: level(score),
      subScores: {
        s_cv: subScore(breakdown, 's_cv', score),
        s_int: subScore(breakdown, 's_int', score),
        s_cross: crossSourceEvaluated
          ? subScore(breakdown, 's_cross', score)
          : null,
        s_id: subScore(breakdown, 's_id', score),
      },
      flags,
      rounds: candidate.rounds.map((round) => {
        const roundScores = round.roundScores as {
          s_int?: number;
          s_id?: number;
          observations?: string[];
        } | null;

        return {
          roundNumber: round.roundNumber,
          sInt: roundScores?.s_int ?? null,
          sId: roundScores?.s_id ?? null,
          varianceDelta: round.varianceDelta,
          wasTruncated: round.wasTruncated,
          observations: roundScores?.observations ?? [],
          deepDivePrompts: round.deepDivePrompts ?? [],
        };
      }),
      behaviourAnalysis:
        (breakdown?.behaviour_analysis as Record<string, unknown>) ?? null,
      personalityAnalysis:
        (breakdown?.personality_analysis as Record<string, unknown>) ?? null,
    };
  }
}
