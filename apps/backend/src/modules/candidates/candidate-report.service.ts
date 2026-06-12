import type { CandidateDetailDto, CandidateReportDto } from './candidates.dto';
import {
  buildRounds,
  buildVerdict,
  clamp,
  componentIndicators,
  componentSummary,
  crossSourceEvaluated,
  level,
  mapPlatformProfile,
  mapSupplementaryAnalysis,
  num,
  parseScreeningEvaluation,
  platformMatrix,
  resolveFlags,
  subScore,
} from './candidate-report.mapper';

export class CandidateReportService {
  build(candidate: CandidateDetailDto): CandidateReportDto {
    const score = clamp(num(candidate.integrityScore));
    const reportLevel = level(score);
    const evaluation = parseScreeningEvaluation(candidate.scoreBreakdown);
    const crossEvaluated = crossSourceEvaluated(evaluation);
    const sCv = subScore(evaluation, 's_cv', score);
    const sInt = subScore(evaluation, 's_int', score);
    const sCross = crossEvaluated
      ? subScore(evaluation, 's_cross', score)
      : null;
    const sId = subScore(evaluation, 's_id', score);

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
      evaluation,
      hasLinkedIn,
      hasGitHub,
      crossEvaluated ? sCross! : 0,
    );

    const flags = resolveFlags(
      candidate,
      evaluation,
      sCv,
      sCross,
      sId,
      sInt,
      aiTextPercent,
      hasLinkedIn,
      hasGitHub,
      rounds,
    );

    const verdictResult = buildVerdict(reportLevel, evaluation, sInt, flags);

    return {
      score,
      level: reportLevel,
      subScores: { s_cv: sCv, s_int: sInt, s_cross: sCross, s_id: sId },
      crossSourceEvaluated: crossEvaluated,
      componentSummaries: {
        s_cv: componentSummary(evaluation, 's_cv'),
        s_int: componentSummary(evaluation, 's_int'),
        s_cross: componentSummary(evaluation, 's_cross'),
        s_id: componentSummary(evaluation, 's_id'),
      },
      componentIndicators: {
        s_cv: componentIndicators(evaluation, 's_cv'),
        s_int: componentIndicators(evaluation, 's_int'),
        s_cross: componentIndicators(evaluation, 's_cross'),
        s_id: componentIndicators(evaluation, 's_id'),
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
      linkedin: mapPlatformProfile(
        hasLinkedIn,
        candidate.linkedinUrl,
        matrix.linkedin_cv_match.score,
      ),
      github: mapPlatformProfile(
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
      behaviourAnalysis: mapSupplementaryAnalysis(
        evaluation,
        'behaviour_analysis',
      ),
      personalityAnalysis: mapSupplementaryAnalysis(
        evaluation,
        'personality_analysis',
      ),
    };
  }
}
