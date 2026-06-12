import {
  screeningEvaluationSchema,
  type ScoreComponent,
  type ScreeningEvaluation,
} from '../screening/dtos/screening-evaluation.dto';
import type { CandidateDetailDto, CandidateReportDto } from './candidates.dto';

type Flag = CandidateReportDto['flags'][number];
type Round = CandidateReportDto['rounds'][number];

const EMPTY_SUPPLEMENTARY: CandidateReportDto['behaviourAnalysis'] = {
  summary: 'Supplementary analysis was not available for this screening.',
  traits: [],
  detailLabel: 'Communication style',
  detail: 'Not assessed.',
  indicators: [],
  motivationSignals: [],
  concerns: [],
};

export function parseScreeningEvaluation(
  breakdown: unknown,
): ScreeningEvaluation | null {
  const result = screeningEvaluationSchema.safeParse(breakdown);
  return result.success ? result.data : null;
}

export function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  return typeof value === 'number' ? value : Number(value) || 0;
}

export function level(score: number): 'high' | 'medium' | 'low' {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function severity(deficit: number): string {
  if (deficit >= 50) return 'critical';
  if (deficit >= 25) return 'warning';
  return 'info';
}

function stringList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter(
    (item): item is string => typeof item === 'string' && item !== '',
  );
}

function componentScore(component: ScoreComponent, fallback: number): number {
  return typeof component.score === 'number' ? clamp(component.score) : fallback;
}

export function crossSourceEvaluated(
  evaluation: ScreeningEvaluation | null,
): boolean {
  if (!evaluation) return false;
  if (evaluation.s_cross.confidence_band === 'not-evaluated') {
    return false;
  }
  return typeof evaluation.s_cross.score === 'number';
}

export function subScore(
  evaluation: ScreeningEvaluation | null,
  key: 's_cv' | 's_int' | 's_cross' | 's_id',
  fallback: number,
): number {
  if (!evaluation) return fallback;
  return componentScore(evaluation[key], fallback);
}

export function componentSummary(
  evaluation: ScreeningEvaluation | null,
  key: 's_cv' | 's_int' | 's_cross' | 's_id',
): string {
  return evaluation?.[key].summary ?? '';
}

export function componentIndicators(
  evaluation: ScreeningEvaluation | null,
  key: 's_cv' | 's_int' | 's_cross' | 's_id',
): string[] {
  return evaluation?.[key].indicators ?? [];
}

export function platformMatrix(
  evaluation: ScreeningEvaluation | null,
  hasLinkedIn: boolean,
  hasGitHub: boolean,
  fallbackCrossScore: number,
): CandidateReportDto['platformMatrix'] {
  if (evaluation?.platform_matrix) {
    return evaluation.platform_matrix;
  }

  if (!hasLinkedIn && !hasGitHub) {
    return {
      linkedin_cv_match: {
        score: null,
        explanation:
          'No LinkedIn profile was submitted. Employment timeline cross-check against the CV was not performed.',
      },
      github_experience_match: {
        score: null,
        explanation:
          'No GitHub profile was submitted. Repository activity could not be compared to claimed engineering experience.',
      },
      cross_platform_consistency: {
        score: null,
        explanation:
          'Cross-platform consistency requires at least one external profile URL. With none provided, this dimension is not scored.',
      },
    };
  }

  return {
    linkedin_cv_match: {
      score: hasLinkedIn ? fallbackCrossScore : null,
      explanation: hasLinkedIn
        ? `LinkedIn data compared to CV timeline; estimated consistency ${fallbackCrossScore}%.`
        : 'LinkedIn not provided.',
    },
    github_experience_match: {
      score: hasGitHub ? Math.max(0, fallbackCrossScore - 8) : null,
      explanation: hasGitHub
        ? 'GitHub activity compared to claimed engineering experience.'
        : 'GitHub not provided.',
    },
    cross_platform_consistency: {
      score: Math.max(0, fallbackCrossScore - 5),
      explanation:
        'Cross-platform name and date consistency across submitted profiles.',
    },
  };
}

export function mapSupplementaryAnalysis(
  evaluation: ScreeningEvaluation | null,
  key: 'behaviour_analysis' | 'personality_analysis',
): CandidateReportDto['behaviourAnalysis'] {
  if (!evaluation) {
    return {
      ...EMPTY_SUPPLEMENTARY,
      detailLabel:
        key === 'personality_analysis' ? 'Work style' : 'Communication style',
    };
  }

  const analysis = evaluation[key];
  return {
    summary: analysis.summary,
    traits: analysis.traits,
    detailLabel: analysis.detail_label,
    detail: analysis.detail,
    indicators: analysis.indicators,
    motivationSignals: analysis.motivation_signals,
    concerns: analysis.concerns,
  };
}

function platform(
  provided: boolean,
  handle: string | null,
  consistency: number | null,
): CandidateReportDto['linkedin'] {
  if (!provided) {
    return {
      provided: false,
      handle: null,
      status: 'not_provided',
      statusLabel: 'NOT PROVIDED',
    };
  }
  if (consistency === null) {
    return {
      provided: true,
      handle,
      status: 'insufficient',
      statusLabel: 'PENDING ANALYSIS',
    };
  }
  if (consistency >= 60) {
    return {
      provided: true,
      handle,
      status: 'authentic',
      statusLabel: 'AUTHENTIC PROFILE',
    };
  }
  return {
    provided: true,
    handle,
    status: 'insufficient',
    statusLabel: 'INSUFFICIENT SIGNAL',
  };
}

export function buildRounds(candidate: CandidateDetailDto): Round[] {
  return candidate.rounds.map((round) => {
    const scores = (round.roundScores ?? {}) as {
      s_int?: number;
      s_id?: number;
      observations?: string[];
      anomalies?: string[];
    };
    const sInt =
      typeof scores.s_int === 'number' ? clamp(scores.s_int) : null;
    const sId = typeof scores.s_id === 'number' ? clamp(scores.s_id) : null;
    const variance =
      round.varianceDelta !== null ? clamp(num(round.varianceDelta)) : null;

    const storedObservations = stringList(scores.observations);
    const storedAnomalies = stringList(scores.anomalies);
    const observations = [
      ...new Set([
        ...storedObservations,
        ...(sInt !== null && sInt <= 55 ? storedAnomalies : []),
      ]),
    ];

    if (round.wasTruncated) {
      observations.push(
        'Response was truncated mid-answer - candidate may have exhausted prepared material or relied on external assistance.',
      );
    }
    if (variance !== null && variance > 15) {
      observations.push(
        `Confidence variance of ${variance} points versus the previous round indicates inconsistent performance.`,
      );
    }
    if (observations.length === 0) {
      if (sInt !== null && sInt < 50) {
        observations.push(
          'Low interview signal density - answers lacked spontaneous technical depth and showed templated phrasing.',
        );
      } else if (sInt !== null && sInt >= 75) {
        observations.push(
          'Strong, consistent interview signal with authentic, unscripted reasoning.',
        );
      } else {
        observations.push(
          'No notable anomalies detected for this round. Responses fell within expected human baselines.',
        );
      }
    }
    if (sId !== null && sId < 50) {
      observations.push(
        'Identity and provenance signal for this round was weak relative to the candidate baseline.',
      );
    }

    return {
      roundNumber: round.roundNumber,
      sInt,
      sId,
      varianceDelta: variance,
      wasTruncated: round.wasTruncated,
      observations: [...new Set(observations)],
      deepDivePrompts: round.deepDivePrompts ?? [],
    };
  });
}

function deriveFlags(
  candidate: CandidateDetailDto,
  sCv: number,
  sCross: number | null,
  sId: number,
  sInt: number,
  aiTextPercent: number,
  hasLinkedIn: boolean,
  hasGitHub: boolean,
  rounds: Round[],
): Flag[] {
  const flags: Flag[] = [];

  if (aiTextPercent >= 35) {
    flags.push({
      type: 'ai_text',
      severity: severity(aiTextPercent),
      description: `Approximately ${aiTextPercent}% of CV narrative text matches AI-generation patterns in experience and summary sections.`,
      confidence: Math.min(0.98, aiTextPercent / 100 + 0.1),
    });
  }

  if (sCross !== null && (hasLinkedIn || hasGitHub) && sCross < 60) {
    const platforms = [hasLinkedIn ? 'LinkedIn' : null, hasGitHub ? 'GitHub' : null]
      .filter(Boolean)
      .join(' and ');
    flags.push({
      type: 'platform_mismatch',
      severity: severity(100 - sCross),
      description: `Submitted ${platforms} data weakly corroborates CV employment or project claims (consistency score ${sCross}%).`,
      confidence: Math.min(0.95, (100 - sCross) / 100 + 0.1),
    });
  }

  if (sId < 50) {
    flags.push({
      type: 'synthetic_profile',
      severity: severity(100 - sId),
      description: `Identity provenance indicators are weak - possible synthetic or recently fabricated profile (identity score ${sId}%).`,
      confidence: Math.min(0.95, (100 - sId) / 100),
    });
  }

  const hasInterviewAnomaly =
    candidate.highInconsistencyWarning ||
    sInt < 55 ||
    rounds.some(
      (round) =>
        round.wasTruncated ||
        (round.varianceDelta ?? 0) > 20 ||
        (round.sInt ?? 100) < 55,
    );

  if (hasInterviewAnomaly) {
    const evidenceRound = rounds.find((round) => (round.sInt ?? 100) < 55);
    const evidence =
      evidenceRound?.observations[0] ??
      'Interview responses show latency, phrasing, or consistency anomalies consistent with live prompt assistance.';

    flags.push({
      type: 'interview_prompt',
      severity:
        sInt < 35 || candidate.highInconsistencyWarning ? 'critical' : 'warning',
      description: evidence,
      confidence: Math.min(0.96, (100 - sInt) / 100 + 0.15),
    });
  }

  return flags;
}

export function resolveFlags(
  candidate: CandidateDetailDto,
  evaluation: ScreeningEvaluation | null,
  sCv: number,
  sCross: number | null,
  sId: number,
  sInt: number,
  aiTextPercent: number,
  hasLinkedIn: boolean,
  hasGitHub: boolean,
  rounds: Round[],
): Flag[] {
  if (evaluation?.flags.length) {
    return evaluation.flags.map((flag) => ({
      type: flag.type,
      severity: flag.severity,
      description: flag.description,
      confidence: flag.confidence,
    }));
  }

  return deriveFlags(
    candidate,
    sCv,
    sCross,
    sId,
    sInt,
    aiTextPercent,
    hasLinkedIn,
    hasGitHub,
    rounds,
  );
}

function integrityRiskFlags(flags: Flag[]): Flag[] {
  return flags.filter(
    (flag) =>
      ['interview_prompt', 'ai_text', 'synthetic_profile'].includes(flag.type) &&
      flag.severity !== 'info',
  );
}

function flagsWithSeverity(flags: Flag[], sev: string): Flag[] {
  return flags.filter((flag) => flag.severity === sev);
}

export function buildVerdict(
  reportLevel: 'high' | 'medium' | 'low',
  evaluation: ScreeningEvaluation | null,
  sInt: number,
  flags: Flag[],
): { title: string; body: string; recommendedActions: string[] } {
  const interviewSummary = componentSummary(evaluation, 's_int');
  const cvSummary = componentSummary(evaluation, 's_cv');
  const criticalFlags = flagsWithSeverity(flags, 'critical');
  const warningFlags = flagsWithSeverity(flags, 'warning');
  const riskFlags = integrityRiskFlags(flags);

  if (
    reportLevel === 'low' ||
    sInt < 45 ||
    criticalFlags.length >= 2 ||
    (criticalFlags.length >= 1 && sInt < 60)
  ) {
    return {
      title: 'SIGNAL ASSESSMENT: Elevated integrity risk indicators',
      body:
        `${interviewSummary} ${cvSummary}`.trim() ||
        'Multiple high-confidence integrity indicators were detected across CV and interview signals. Human follow-up is suggested to validate these observations.',
      recommendedActions: [
        'Review cited evidence with your hiring team',
        'Consider a supervised re-interview without external tools',
        'Use flagged signals to shape targeted follow-up questions',
      ],
    };
  }

  if (
    riskFlags.length > 0 ||
    criticalFlags.length > 0 ||
    warningFlags.length >= 2 ||
    reportLevel === 'medium'
  ) {
    const flagSummary = riskFlags
      .map((flag) => flag.description)
      .slice(0, 2)
      .join(' ');

    return {
      title: 'SIGNAL ASSESSMENT: Mixed integrity signals - follow-up suggested',
      body:
        [cvSummary, interviewSummary, flagSummary].filter(Boolean).join(' ') ||
        'Active integrity flags may warrant additional human review before relying on this score alone.',
      recommendedActions: [
        'Request an original CV sample without AI-assisted drafting',
        'Consider a live technical skills assessment',
        'Manually review the flagged interview segments',
      ],
    };
  }

  return {
    title: 'SIGNAL ASSESSMENT: Comparatively strong authentic signal density',
    body:
      interviewSummary ||
      'Evaluated vectors show comparatively strong authentic signal density, though this remains a probability heuristic rather than a hiring decision.',
    recommendedActions: [
      'Integrity indicators are comparatively clear across evaluated vectors',
      'Routine reference checks may still add independent validation',
      'Use this score as one input alongside your standard hiring process',
    ],
  };
}

export function mapPlatformProfile(
  provided: boolean,
  handle: string | null,
  consistency: number | null,
): CandidateReportDto['linkedin'] {
  return platform(provided, handle, consistency);
}
