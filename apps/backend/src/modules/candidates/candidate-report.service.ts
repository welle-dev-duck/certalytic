import type { CandidateDetailDto, CandidateReportDto } from './candidates.dto';

type Breakdown = Record<string, unknown>;
type Flag = CandidateReportDto['flags'][number];
type Round = CandidateReportDto['rounds'][number];

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  return typeof value === 'number' ? value : Number(value) || 0;
}

function level(score: number): 'high' | 'medium' | 'low' {
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
  return values.filter((item): item is string => typeof item === 'string' && item !== '');
}

function summary(breakdown: Breakdown, key: string): string {
  const entry = breakdown[key];
  if (!entry || typeof entry !== 'object') return '';
  const summaryValue = (entry as { summary?: unknown }).summary;
  return typeof summaryValue === 'string' ? summaryValue : '';
}

function indicators(breakdown: Breakdown, key: string): string[] {
  const entry = breakdown[key];
  if (!entry || typeof entry !== 'object') return [];
  return stringList((entry as { indicators?: unknown }).indicators);
}

function crossSourceEvaluated(breakdown: Breakdown): boolean {
  const entry = breakdown.s_cross;
  if (!entry || typeof entry !== 'object') return false;
  if ((entry as { confidence_band?: string }).confidence_band === 'not-evaluated') {
    return false;
  }
  return typeof (entry as { score?: unknown }).score === 'number';
}

function sub(breakdown: Breakdown, key: string, fallback: number): number {
  const entry = breakdown[key];
  if (!entry || typeof entry !== 'object') return fallback;
  const score = (entry as { score?: unknown }).score;
  return typeof score === 'number' ? clamp(score) : fallback;
}

function normalizeMatrixRow(row: unknown): {
  score: number | null;
  explanation: string;
} {
  if (!row || typeof row !== 'object') {
    return { score: null, explanation: 'Not evaluated.' };
  }
  const record = row as { score?: unknown; explanation?: unknown };
  return {
    score: typeof record.score === 'number' ? clamp(record.score) : null,
    explanation:
      typeof record.explanation === 'string'
        ? record.explanation
        : 'No explanation provided.',
  };
}

function platformMatrix(
  breakdown: Breakdown,
  hasLinkedIn: boolean,
  hasGitHub: boolean,
  fallbackCrossScore: number,
): CandidateReportDto['platformMatrix'] {
  const stored = breakdown.platform_matrix;
  if (stored && typeof stored === 'object' && Object.keys(stored).length > 0) {
    const matrix = stored as Record<string, unknown>;
    return {
      linkedin_cv_match: normalizeMatrixRow(matrix.linkedin_cv_match),
      github_experience_match: normalizeMatrixRow(matrix.github_experience_match),
      cross_platform_consistency: normalizeMatrixRow(
        matrix.cross_platform_consistency,
      ),
    };
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

function supplementaryAnalysis(
  breakdown: Breakdown,
  key: string,
  personality = false,
): CandidateReportDto['behaviourAnalysis'] {
  const stored = breakdown[key];
  if (!stored || typeof stored !== 'object') {
    return {
      summary: 'Supplementary analysis was not available for this screening.',
      traits: [],
      detailLabel: personality ? 'Work style' : 'Communication style',
      detail: 'Not assessed.',
      indicators: [],
      motivationSignals: [],
      concerns: [],
    };
  }

  const record = stored as Record<string, unknown>;
  const detail =
    typeof record.detail === 'string'
      ? record.detail
      : personality
        ? typeof record.work_style === 'string'
          ? record.work_style
          : 'Not assessed.'
        : typeof record.communication_style === 'string'
          ? record.communication_style
          : 'Not assessed.';

  return {
    summary:
      typeof record.summary === 'string'
        ? record.summary
        : 'No supplementary summary provided.',
    traits: stringList(record.traits),
    detailLabel:
      typeof record.detail_label === 'string'
        ? record.detail_label
        : personality
          ? 'Work style'
          : 'Communication style',
    detail,
    indicators: stringList(
      record.indicators ??
        (personality ? record.culture_fit_indicators : record.collaboration_indicators),
    ),
    motivationSignals: stringList(record.motivation_signals),
    concerns: stringList(record.concerns),
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

function buildRounds(candidate: CandidateDetailDto): Round[] {
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

function resolveFlags(
  candidate: CandidateDetailDto,
  breakdown: Breakdown,
  sCv: number,
  sCross: number | null,
  sId: number,
  sInt: number,
  aiTextPercent: number,
  hasLinkedIn: boolean,
  hasGitHub: boolean,
  rounds: Round[],
): Flag[] {
  const stored = breakdown.flags;
  if (Array.isArray(stored) && stored.length > 0) {
    return stored
      .filter(
        (flag): flag is Record<string, unknown> =>
          typeof flag === 'object' && flag !== null && 'description' in flag,
      )
      .map((flag) => ({
        type: String(flag.type ?? 'interview_prompt'),
        severity: String(flag.severity ?? 'warning'),
        description: String(flag.description),
        confidence:
          typeof flag.confidence === 'number' ? flag.confidence : 0.75,
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

function verdict(
  reportLevel: 'high' | 'medium' | 'low',
  breakdown: Breakdown,
  sInt: number,
  flags: Flag[],
): { title: string; body: string; recommendedActions: string[] } {
  const interviewSummary = summary(breakdown, 's_int');
  const cvSummary = summary(breakdown, 's_cv');
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

export class CandidateReportService {
  build(candidate: CandidateDetailDto): CandidateReportDto {
    const score = clamp(num(candidate.integrityScore));
    const reportLevel = level(score);
    const breakdown = candidate.scoreBreakdown ?? {};
    const crossEvaluated = crossSourceEvaluated(breakdown);
    const sCv = sub(breakdown, 's_cv', score);
    const sInt = sub(breakdown, 's_int', score);
    const sCross = crossEvaluated ? sub(breakdown, 's_cross', score) : null;
    const sId = sub(breakdown, 's_id', score);

    const rounds = buildRounds(candidate);
    const variances = rounds
      .map((round) => round.varianceDelta)
      .filter((value): value is number => value !== null);
    const avgVariance =
      variances.length > 0
        ? variances.reduce((sum, value) => sum + value, 0) / variances.length
        : 0;
    const responseScore = clamp(100 - avgVariance);

    const aiTextPercent = clamp(100 - sCv);
    const hasLinkedIn = Boolean(candidate.linkedinUrl?.trim());
    const hasGitHub = Boolean(candidate.githubUsername?.trim());
    const matrix = platformMatrix(
      breakdown,
      hasLinkedIn,
      hasGitHub,
      crossEvaluated ? sCross! : 0,
    );

    const flags = resolveFlags(
      candidate,
      breakdown,
      sCv,
      sCross,
      sId,
      sInt,
      aiTextPercent,
      hasLinkedIn,
      hasGitHub,
      rounds,
    );

    const verdictResult = verdict(reportLevel, breakdown, sInt, flags);

    return {
      score,
      level: reportLevel,
      subScores: { s_cv: sCv, s_int: sInt, s_cross: sCross, s_id: sId },
      crossSourceEvaluated: crossEvaluated,
      componentSummaries: {
        s_cv: summary(breakdown, 's_cv'),
        s_int: summary(breakdown, 's_int'),
        s_cross: summary(breakdown, 's_cross'),
        s_id: summary(breakdown, 's_id'),
      },
      componentIndicators: {
        s_cv: indicators(breakdown, 's_cv'),
        s_int: indicators(breakdown, 's_int'),
        s_cross: indicators(breakdown, 's_cross'),
        s_id: indicators(breakdown, 's_id'),
      },
      aiTextPercent,
      platformConsistency: crossEvaluated ? sCross : null,
      platformMatrix: matrix,
      interviewVariance: clamp(100 - sInt),
      responseScore,
      radar: [
        { subject: 'CV Auth.', value: sCv },
        { subject: 'Platform', value: crossEvaluated ? sCross! : 0 },
        { subject: 'Credentials', value: sId },
        { subject: 'Interview', value: sInt },
        { subject: 'Response', value: responseScore },
      ],
      riskVectors: [
        { name: 'AI Text', value: aiTextPercent },
        {
          name: 'Platform',
          value: crossEvaluated ? clamp(100 - sCross!) : 0,
        },
        { name: 'Confidence', value: clamp(100 - sInt) },
      ],
      flags,
      linkedin: platform(
        hasLinkedIn,
        candidate.linkedinUrl,
        matrix.linkedin_cv_match.score,
      ),
      github: platform(
        hasGitHub,
        candidate.githubUsername,
        matrix.github_experience_match.score,
      ),
      verdict: {
        level: reportLevel,
        title: verdictResult.title,
        body: verdictResult.body,
      },
      recommendedActions: verdictResult.recommendedActions,
      rounds,
      behaviourAnalysis: supplementaryAnalysis(breakdown, 'behaviour_analysis'),
      personalityAnalysis: supplementaryAnalysis(
        breakdown,
        'personality_analysis',
        true,
      ),
    };
  }
}
