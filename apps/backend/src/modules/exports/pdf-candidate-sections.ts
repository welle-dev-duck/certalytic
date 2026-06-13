import type { CandidateReportDto } from '../candidates/candidates.dto';
import { SPACING } from './pdf-layout.constants';
import type { CandidatePdfMetadata } from './pdf-layout.constants';
import type { PdfPageRenderer } from './pdf-page-renderer';

type SupplementaryAnalysis = CandidateReportDto['behaviourAnalysis'];

function addCandidateMetadata(
  renderer: PdfPageRenderer,
  metadata: CandidatePdfMetadata,
): void {
  renderer.addSubsection('Candidate details');
  if (metadata.linkedinUrl) {
    renderer.addParameter('LinkedIn', metadata.linkedinUrl);
  }
  if (metadata.githubUsername) {
    renderer.addParameter('GitHub', metadata.githubUsername);
  }
  renderer.shiftY(-SPACING.tight);
}

function addSignalSummary(
  renderer: PdfPageRenderer,
  report: CandidateReportDto,
): void {
  renderer.addSection('Signal summary');
  renderer.drawCalloutPanel(report.verdict.title, report.verdict.body);

  renderer.addSubsection('Signal vector scores');
  renderer.drawParameterPanel(
    report.radar.map(({ subject, value }) => ({
      label: subject,
      value: `${value}%`,
    })),
  );
  renderer.shiftY(-SPACING.tight);

  renderer.addSubsection('Component scores');
  renderer.drawProgressBar('CV signal', report.subScores.s_cv, 'higher');
  renderer.drawProgressBar('Interview signal', report.subScores.s_int, 'higher');
  if (report.subScores.s_cross !== null) {
    renderer.drawProgressBar(
      'Cross-source signal',
      report.subScores.s_cross,
      'higher',
    );
  }
  renderer.drawProgressBar('Identity signal', report.subScores.s_id, 'higher');
  renderer.drawProgressBar('Response score', report.responseScore, 'higher');
  renderer.shiftY(-SPACING.tight);
}

function addCvAnalysis(
  renderer: PdfPageRenderer,
  report: CandidateReportDto,
): void {
  renderer.addSection('CV analysis');
  renderer.drawProgressBar(
    'AI-generated text probability',
    report.aiTextPercent,
    'lower',
  );
  renderer.drawProgressBar('CV authorship score', report.subScores.s_cv, 'higher');
  for (const vector of report.riskVectors) {
    renderer.drawProgressBar(vector.name, vector.value, 'lower');
  }

  if (report.componentSummaries.s_cv) {
    renderer.addSubsection('Analysis summary');
    renderer.addParagraph(report.componentSummaries.s_cv);
  }

  if (report.componentIndicators.s_cv.length > 0) {
    renderer.addSubsection('Indicators');
    renderer.addBulletList(report.componentIndicators.s_cv);
  }
}

function addMatrixRow(
  renderer: PdfPageRenderer,
  label: string,
  score: number | null,
  explanation: string,
): void {
  if (score !== null) {
    renderer.drawProgressBar(label, score, 'higher');
  } else {
    renderer.addParameter(label, 'Not evaluated');
  }
  renderer.addParagraph(explanation);
  renderer.shiftY(-SPACING.tight);
}

function addPlatformProfile(
  renderer: PdfPageRenderer,
  platform: CandidateReportDto['linkedin'],
  url: string | null | undefined,
): void {
  renderer.addParameter('Status', platform.statusLabel);
  if (platform.handle) {
    renderer.addParameter('Handle', platform.handle);
  }
  if (url) {
    renderer.addParameter('URL', url);
  }
  if (!platform.provided) {
    renderer.addParagraph('Not provided for cross-reference.');
  }
  renderer.shiftY(-SPACING.tight);
}

function addPlatformCrossRef(
  renderer: PdfPageRenderer,
  report: CandidateReportDto,
  metadata?: CandidatePdfMetadata,
): void {
  renderer.addSection('Platform cross-reference');

  const matrix = report.platformMatrix;
  renderer.addSubsection('Platform consistency matrix');
  addMatrixRow(
    renderer,
    'LinkedIn <-> CV employment match',
    matrix.linkedin_cv_match.score,
    matrix.linkedin_cv_match.explanation,
  );
  addMatrixRow(
    renderer,
    'GitHub activity <-> claimed experience',
    matrix.github_experience_match.score,
    matrix.github_experience_match.explanation,
  );
  addMatrixRow(
    renderer,
    'Cross-platform name/date consistency',
    matrix.cross_platform_consistency.score,
    matrix.cross_platform_consistency.explanation,
  );

  if (report.componentSummaries.s_cross) {
    renderer.addSubsection('Cross-source summary');
    renderer.addParagraph(report.componentSummaries.s_cross);
  }

  if (report.componentIndicators.s_cross.length > 0) {
    renderer.addSubsection('Cross-source indicators');
    renderer.addBulletList(report.componentIndicators.s_cross);
  }

  renderer.addSubsection('LinkedIn');
  addPlatformProfile(renderer, report.linkedin, metadata?.linkedinUrl);

  renderer.addSubsection('GitHub');
  addPlatformProfile(
    renderer,
    report.github,
    metadata?.githubUsername
      ? `https://github.com/${metadata.githubUsername}`
      : null,
  );

  if (report.componentSummaries.s_id) {
    renderer.addSubsection('Identity summary');
    renderer.addParagraph(report.componentSummaries.s_id);
  }

  if (report.componentIndicators.s_id.length > 0) {
    renderer.addSubsection('Identity indicators');
    renderer.addBulletList(report.componentIndicators.s_id);
  }
}

function addSupplementaryAnalysis(
  renderer: PdfPageRenderer,
  title: string,
  analysis: SupplementaryAnalysis,
  showMotivation = false,
): void {
  renderer.addSection(title);
  renderer.addParagraph(
    'Supplementary hiring context only. Not included in the hiring integrity score.',
  );
  renderer.addParagraph(analysis.summary);

  if (analysis.detail) {
    renderer.addSubsection(analysis.detailLabel);
    renderer.addParagraph(analysis.detail);
  }

  if (analysis.traits.length > 0) {
    renderer.addSubsection('Observed traits');
    renderer.addBulletList(analysis.traits);
  }

  if (analysis.indicators.length > 0) {
    renderer.addSubsection('Indicators');
    renderer.addBulletList(analysis.indicators);
  }

  if (showMotivation && analysis.motivationSignals.length > 0) {
    renderer.addSubsection('Motivation signals');
    renderer.addBulletList(analysis.motivationSignals);
  }

  if (analysis.concerns.length > 0) {
    renderer.addSubsection('Watchpoints');
    renderer.addBulletList(analysis.concerns);
  }
}

function addInterviewAnalysis(
  renderer: PdfPageRenderer,
  report: CandidateReportDto,
): void {
  renderer.addSection('Interview analysis');
  renderer.addParameter('Rounds recorded', String(report.rounds.length));
  renderer.addParameter(
    'Truncated rounds',
    String(report.rounds.filter((round) => round.wasTruncated).length),
  );
  renderer.drawProgressBar('Confidence variance', report.interviewVariance, 'lower');
  renderer.addParameter(
    'Prompt injection risk',
    report.interviewVariance > 40 ? 'Elevated' : 'Low',
  );

  if (report.componentSummaries.s_int) {
    renderer.addSubsection('Interview summary');
    renderer.addParagraph(report.componentSummaries.s_int);
  }

  if (report.componentIndicators.s_int.length > 0) {
    renderer.addSubsection('Interview indicators');
    renderer.addBulletList(report.componentIndicators.s_int);
  }

  if (report.rounds.length === 0) {
    renderer.addParagraph('No interview transcript recorded for this candidate.');
    return;
  }

  for (const round of report.rounds) {
    renderer.addSubsection(`Round ${round.roundNumber}`);
    if (round.sInt !== null) {
      renderer.drawProgressBar('Interview score', round.sInt, 'higher');
    }
    if (round.sId !== null) {
      renderer.drawProgressBar('Identity score', round.sId, 'higher');
    }
    renderer.addParameter(
      'Variance delta',
      round.varianceDelta !== null ? String(round.varianceDelta) : '-',
    );

    if (round.wasTruncated) {
      renderer.addParagraph('Response was truncated mid-answer.');
    }

    if (round.observations.length > 0) {
      renderer.addSubsection('Observations');
      renderer.addBulletList(round.observations);
    }

    if (round.deepDivePrompts.length > 0) {
      renderer.addSubsection('Suggested deep-dive prompts');
      renderer.addBulletList(round.deepDivePrompts);
    }
  }
}

function addFlags(renderer: PdfPageRenderer, report: CandidateReportDto): void {
  if (report.flags.length === 0) return;

  renderer.addSection('Active flags');
  for (const flag of report.flags) {
    renderer.drawFlag(flag.severity, flag.description, flag.confidence);
  }
  renderer.shiftY(-SPACING.tight);
}

export function renderCandidateReportSections(
  renderer: PdfPageRenderer,
  report: CandidateReportDto,
  metadata?: CandidatePdfMetadata,
): void {
  addSignalSummary(renderer, report);

  if (metadata) {
    addCandidateMetadata(renderer, metadata);
  }

  addCvAnalysis(renderer, report);
  addPlatformCrossRef(renderer, report, metadata);
  addSupplementaryAnalysis(renderer, 'Behaviour analysis', report.behaviourAnalysis);
  addSupplementaryAnalysis(
    renderer,
    'Personality analysis',
    report.personalityAnalysis,
    true,
  );
  addInterviewAnalysis(renderer, report);
  addFlags(renderer, report);
}
