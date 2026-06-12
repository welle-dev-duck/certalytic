import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from 'pdf-lib';

import type { CandidateReportDto } from '../candidates/candidates.dto';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const SPACING = {
  sectionTop: 22,
  sectionBottom: 14,
  subsectionTop: 14,
  subsectionBottom: 8,
  block: 12,
  paragraph: 8,
  item: 6,
  tight: 4,
  progressBar: 30,
};

const TYPE = {
  preTitle: 9,
  docTitle: 20,
  docMeta: 10,
  section: 13,
  subsection: 11,
  label: 8,
  body: 9,
  param: 9,
  hint: 7,
};

const COLORS = {
  primary: rgb(0.18, 0.36, 0.33),
  text: rgb(0.1, 0.18, 0.16),
  muted: rgb(0.36, 0.44, 0.41),
  label: rgb(0.45, 0.52, 0.5),
  border: rgb(0.77, 0.83, 0.81),
  track: rgb(0.9, 0.93, 0.92),
  panel: rgb(0.97, 0.98, 0.98),
  disclaimer: rgb(0.33, 0.29, 0.07),
  high: rgb(0.06, 0.73, 0.51),
  medium: rgb(0.96, 0.62, 0.04),
  low: rgb(0.94, 0.27, 0.27),
  info: rgb(0.23, 0.51, 0.96),
  warning: rgb(0.96, 0.62, 0.04),
  critical: rgb(0.94, 0.27, 0.27),
};

const DISTRIBUTION_META = [
  { key: 'high' as const, label: 'High (75+)', color: COLORS.high },
  { key: 'medium' as const, label: 'Medium (50-74)', color: COLORS.medium },
  { key: 'low' as const, label: 'Low (<50)', color: COLORS.low },
];

function sanitizePdfText(text: string): string {
  return text
    .replace(/\u2014/g, '-')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '');
}

type PdfDocumentBuilderOptions = {
  watermarked: boolean;
};

export type CandidatePdfMetadata = {
  email?: string | null;
  linkedinUrl?: string | null;
  githubUsername?: string | null;
  followUpSuggested?: string[] | null;
};

export type RolePdfStats = {
  avgIntegrity: number | null;
  scored: number;
  completedCount: number;
  distribution: {
    high: number;
    medium: number;
    low: number;
  };
};

type SupplementaryAnalysis = CandidateReportDto['behaviourAnalysis'];

type ProgressDirection = 'higher' | 'lower';

export class PdfDocumentBuilder {
  private document!: PDFDocument;
  private page!: PDFPage;
  private regularFont!: PDFFont;
  private boldFont!: PDFFont;
  private y = PAGE_HEIGHT - MARGIN;
  private candidatePageStarted = false;

  private constructor(private readonly options: PdfDocumentBuilderOptions) {}

  static async create(
    options: PdfDocumentBuilderOptions,
  ): Promise<PdfDocumentBuilder> {
    const builder = new PdfDocumentBuilder(options);
    await builder.init();

    return builder;
  }

  private async init(): Promise<void> {
    this.document = await PDFDocument.create();
    this.regularFont = await this.document.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.document.embedFont(StandardFonts.HelveticaBold);
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  addCoverHeader(
    title: string,
    generatedAt: string,
    options?: { candidatesScreened?: number },
  ): void {
    this.addScoreDisclaimer();
    this.y -= SPACING.block;

    this.drawText(
      'Certalytic Integrity Dossier',
      TYPE.preTitle,
      this.boldFont,
      COLORS.primary,
    );
    this.y -= SPACING.block;
    this.drawText(title, TYPE.docTitle, this.boldFont, COLORS.text);
    this.y -= 2;

    if (options?.candidatesScreened !== undefined) {
      this.drawText(
        `Candidates Screened: ${options.candidatesScreened}`,
        TYPE.docMeta,
        this.boldFont,
        COLORS.text,
      );
      this.y -= 2;
    }

    this.drawText(
      `Generated ${generatedAt}`,
      TYPE.docMeta,
      this.regularFont,
      COLORS.muted,
    );
    this.y -= SPACING.block;
    this.drawDivider();
    this.y -= SPACING.block;
  }

  addRoleOverview(
    description: string | null | undefined,
    stats?: RolePdfStats,
  ): void {
    if (stats) {
      if (stats.avgIntegrity !== null) {
        this.drawScoreBox(
          Math.round(stats.avgIntegrity),
          `Avg candidate integrity · ${stats.scored} scored · ${stats.completedCount} completed`,
          this.scoreColor(stats.avgIntegrity),
        );
      } else {
        this.addLabeledBlock('Avg candidate integrity');
        this.addParagraph('No scored candidates yet.');
      }

      for (const item of DISTRIBUTION_META) {
        this.drawDistributionBar(
          item.label,
          stats.distribution[item.key],
          stats.scored,
          item.color,
        );
      }
      this.y -= SPACING.tight;
    }

    if (description?.trim()) {
      this.addLabeledBlock('Job description');
      this.addParagraph(description.trim());
    }
  }

  addScoreDisclaimer(): void {
    const title = 'IMPORTANT';
    const text =
      'Integrity scores represent a probability heuristic derived from multi-signal analysis, not an absolute verdict. Use this dossier to guide structured human follow-up and hiring decisions.';
    const bodySize = TYPE.body;
    const titleSize = TYPE.param;
    const lineHeight = 11;
    const bodyLines = this.wrapLines(text, bodySize, this.boldFont);
    const panelHeight = 22 + bodyLines.length * lineHeight + 10;
    this.ensureSpace(panelHeight + SPACING.block);

    const panelTop = this.y;
    const panelBottom = panelTop - panelHeight;
    const inset = 10;

    this.page.drawRectangle({
      x: MARGIN,
      y: panelBottom,
      width: CONTENT_WIDTH,
      height: panelHeight,
      color: rgb(1, 0.97, 0.9),
      borderColor: COLORS.warning,
      borderWidth: 1.5,
    });

    this.page.drawRectangle({
      x: MARGIN,
      y: panelBottom,
      width: 3,
      height: panelHeight,
      color: COLORS.warning,
    });

    this.page.drawText(title, {
      x: MARGIN + inset,
      y: panelTop - 12,
      size: titleSize,
      font: this.boldFont,
      color: COLORS.disclaimer,
    });

    let textY = panelTop - 24;
    for (const line of bodyLines) {
      this.page.drawText(line, {
        x: MARGIN + inset,
        y: textY,
        size: bodySize,
        font: this.boldFont,
        color: COLORS.disclaimer,
      });
      textY -= lineHeight;
    }

    this.y = panelBottom - SPACING.tight;
  }

  startCandidatePage(): void {
    this.startNewPage();
    this.candidatePageStarted = true;
  }

  addCandidateReport(
    candidateName: string,
    report: CandidateReportDto,
    metadata?: CandidatePdfMetadata,
  ): void {
    if (!this.candidatePageStarted) {
      this.startCandidatePage();
    }

    this.y -= SPACING.tight;
    this.addIntegrityLevel(report.level);
    this.drawText(
      `Candidate: ${candidateName}`,
      TYPE.section,
      this.boldFont,
      COLORS.text,
    );
    this.y -= SPACING.tight;

    if (metadata?.email) {
      this.drawText(metadata.email, TYPE.docMeta, this.regularFont, COLORS.muted);
      this.y -= SPACING.block;
    } else {
      this.y -= SPACING.subsectionBottom;
    }

    this.addScoreBox(report.score, report.level);
    this.addSignalSummary(report);

    if (metadata) {
      this.addCandidateMetadata(metadata);
    }

    this.addCvAnalysis(report);
    this.addPlatformCrossRef(report, metadata);
    this.addSupplementaryAnalysis('Behaviour analysis', report.behaviourAnalysis);
    this.addSupplementaryAnalysis(
      'Personality analysis',
      report.personalityAnalysis,
      true,
    );
    this.addInterviewAnalysis(report);
    this.addFlags(report);

    const followUps = [
      ...report.recommendedActions,
      ...(metadata?.followUpSuggested ?? []),
    ];

    if (followUps.length > 0) {
      this.addSection('Suggested follow-ups');
      this.addBulletList([...new Set(followUps)]);
    }

    this.candidatePageStarted = false;
  }

  addClosingPage(siteUrl: string): void {
    this.startNewPage();

    const contentTop = PAGE_HEIGHT - MARGIN - 120;

    this.page.drawText('Report attestation', {
      x: MARGIN,
      y: contentTop,
      size: TYPE.section,
      font: this.boldFont,
      color: COLORS.text,
    });

    const attestation =
      'This report was generated by Certalytic Candidate Integrity Scoring Engine.';
    this.y = contentTop - 24;
    this.drawWrappedText(attestation, TYPE.subsection, this.boldFont, COLORS.text);

    this.y -= SPACING.block;
    const disclaimer =
      'Certalytic applies automated document parsing, cross-platform verification, interview signal analysis, and statistical consistency modelling to produce integrity indicators. Outputs are advisory assessments intended to support recruiter judgment and should be interpreted alongside live interviews, reference checks, and role-specific validation.';
    this.drawWrappedText(disclaimer, TYPE.body, this.regularFont, COLORS.muted);

    this.drawStamp();

    const footerY = MARGIN + 28;
    this.page.drawLine({
      start: { x: MARGIN, y: footerY + 18 },
      end: { x: PAGE_WIDTH - MARGIN, y: footerY + 18 },
      thickness: 1,
      color: COLORS.border,
    });

    this.page.drawText(sanitizePdfText(siteUrl), {
      x: MARGIN,
      y: footerY,
      size: TYPE.body,
      font: this.regularFont,
      color: COLORS.muted,
    });

    const confidential = 'Confidential hiring intelligence';
    const confidentialWidth = this.regularFont.widthOfTextAtSize(
      confidential,
      TYPE.hint,
    );
    this.page.drawText(confidential, {
      x: PAGE_WIDTH - MARGIN - confidentialWidth,
      y: footerY,
      size: TYPE.hint,
      font: this.regularFont,
      color: COLORS.label,
    });
  }

  async build(): Promise<Buffer> {
    if (this.options.watermarked) {
      const raw = await this.document.save();
      const { applyPdfWatermark } = await import('./pdf-watermark');
      const watermarked = await applyPdfWatermark(raw, true);

      return Buffer.from(watermarked);
    }

    const bytes = await this.document.save();

    return Buffer.from(bytes);
  }

  private addSection(title: string): void {
    this.y -= SPACING.sectionTop;
    this.ensureSpace(32);
    this.drawText(title, TYPE.section, this.boldFont, COLORS.text);
    this.y -= SPACING.tight;
    this.drawDivider();
    this.y -= SPACING.sectionBottom;
  }

  private addLabeledBlock(label: string): void {
    this.y -= SPACING.subsectionTop;
    this.ensureSpace(20);
    this.drawText(label.toUpperCase(), TYPE.label, this.boldFont, COLORS.label);
    this.y -= SPACING.subsectionBottom;
  }

  private addSubsection(title: string): void {
    this.y -= SPACING.subsectionTop;
    this.ensureSpace(20);
    this.drawText(title, TYPE.subsection, this.boldFont, COLORS.text);
    this.y -= SPACING.subsectionBottom;
  }

  private addIntegrityLevel(level: string): void {
    this.ensureSpace(20);
    const label = `Integrity level: ${level.toUpperCase()}`;
    this.drawText(label, TYPE.label, this.boldFont, this.levelColor(level));
    this.y -= SPACING.item;
  }

  private addScoreBox(score: number, level: string): void {
    this.drawScoreBox(
      score,
      `Hiring integrity score · ${level}`,
      this.levelColor(level),
    );
  }

  private drawScoreBox(
    score: number,
    subtitle: string,
    scoreColor: RGB = COLORS.primary,
  ): void {
    this.ensureSpace(72);
    const boxHeight = 56;
    const boxTop = this.y;

    this.page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: COLORS.panel,
      borderColor: COLORS.primary,
      borderWidth: 1.5,
    });

    const scoreText = String(score);
    const scoreWidth = this.boldFont.widthOfTextAtSize(scoreText, 28);

    this.page.drawText(scoreText, {
      x: MARGIN + CONTENT_WIDTH / 2 - scoreWidth / 2,
      y: boxTop - 36,
      size: 28,
      font: this.boldFont,
      color: scoreColor,
    });

    const subtitleLines = this.wrapLines(subtitle, TYPE.hint, this.regularFont);
    const subtitleLine = subtitleLines[0] ?? subtitle;
    const levelWidth = this.regularFont.widthOfTextAtSize(
      subtitleLine,
      TYPE.hint,
    );

    this.page.drawText(subtitleLine, {
      x: MARGIN + CONTENT_WIDTH / 2 - levelWidth / 2,
      y: boxTop - 50,
      size: TYPE.hint,
      font: this.regularFont,
      color: COLORS.muted,
    });

    this.y = boxTop - boxHeight - SPACING.block;
  }

  private addParameter(label: string, value: string): void {
    this.ensureSpace(18);
    this.page.drawText(sanitizePdfText(label), {
      x: MARGIN,
      y: this.y,
      size: TYPE.param,
      font: this.regularFont,
      color: COLORS.muted,
    });

    const valueWidth = this.boldFont.widthOfTextAtSize(value, TYPE.param);
    this.page.drawText(value, {
      x: PAGE_WIDTH - MARGIN - valueWidth,
      y: this.y,
      size: TYPE.param,
      font: this.boldFont,
      color: COLORS.text,
    });

    this.y -= TYPE.param + SPACING.item;
  }

  private addParagraph(text: string): void {
    this.drawWrappedText(text, TYPE.body, this.regularFont, COLORS.text);
    this.y -= SPACING.paragraph;
  }

  private addBulletList(items: string[]): void {
    for (const item of items) {
      this.drawWrappedText(`• ${item}`, TYPE.body, this.regularFont, COLORS.text);
      this.y -= SPACING.tight;
    }
    this.y -= SPACING.item;
  }

  private addCandidateMetadata(metadata: CandidatePdfMetadata): void {
    this.addSubsection('Candidate details');
    if (metadata.linkedinUrl) {
      this.addParameter('LinkedIn', metadata.linkedinUrl);
    }
    if (metadata.githubUsername) {
      this.addParameter('GitHub', metadata.githubUsername);
    }
    this.y -= SPACING.tight;
  }

  private addSignalSummary(report: CandidateReportDto): void {
    this.addSection('Signal summary');
    this.drawCalloutPanel(report.verdict.title, report.verdict.body);

    this.addSubsection('Signal vector scores');
    this.drawParameterPanel(
      report.radar.map(({ subject, value }) => ({
        label: subject,
        value: `${value}%`,
      })),
    );
    this.y -= SPACING.tight;

    this.addSubsection('Component scores');
    this.drawProgressBar('CV signal', report.subScores.s_cv, 'higher');
    this.drawProgressBar('Interview signal', report.subScores.s_int, 'higher');
    if (report.subScores.s_cross !== null) {
      this.drawProgressBar('Cross-source signal', report.subScores.s_cross, 'higher');
    }
    this.drawProgressBar('Identity signal', report.subScores.s_id, 'higher');
    this.drawProgressBar('Response score', report.responseScore, 'higher');
    this.y -= SPACING.tight;
  }

  private addCvAnalysis(report: CandidateReportDto): void {
    this.addSection('CV analysis');
    this.drawProgressBar(
      'AI-generated text probability',
      report.aiTextPercent,
      'lower',
    );
    this.drawProgressBar('CV authorship score', report.subScores.s_cv, 'higher');
    for (const vector of report.riskVectors) {
      this.drawProgressBar(vector.name, vector.value, 'lower');
    }

    if (report.componentSummaries.s_cv) {
      this.addSubsection('Analysis summary');
      this.addParagraph(report.componentSummaries.s_cv);
    }

    if (report.componentIndicators.s_cv.length > 0) {
      this.addSubsection('Indicators');
      this.addBulletList(report.componentIndicators.s_cv);
    }
  }

  private addPlatformCrossRef(
    report: CandidateReportDto,
    metadata?: CandidatePdfMetadata,
  ): void {
    this.addSection('Platform cross-reference');

    const matrix = report.platformMatrix;
    this.addSubsection('Platform consistency matrix');
    this.addMatrixRow(
      'LinkedIn <-> CV employment match',
      matrix.linkedin_cv_match.score,
      matrix.linkedin_cv_match.explanation,
    );
    this.addMatrixRow(
      'GitHub activity <-> claimed experience',
      matrix.github_experience_match.score,
      matrix.github_experience_match.explanation,
    );
    this.addMatrixRow(
      'Cross-platform name/date consistency',
      matrix.cross_platform_consistency.score,
      matrix.cross_platform_consistency.explanation,
    );

    if (report.componentSummaries.s_cross) {
      this.addSubsection('Cross-source summary');
      this.addParagraph(report.componentSummaries.s_cross);
    }

    if (report.componentIndicators.s_cross.length > 0) {
      this.addSubsection('Cross-source indicators');
      this.addBulletList(report.componentIndicators.s_cross);
    }

    this.addSubsection('LinkedIn');
    this.addPlatformProfile(report.linkedin, metadata?.linkedinUrl);

    this.addSubsection('GitHub');
    this.addPlatformProfile(
      report.github,
      metadata?.githubUsername
        ? `https://github.com/${metadata.githubUsername}`
        : null,
    );

    if (report.componentSummaries.s_id) {
      this.addSubsection('Identity summary');
      this.addParagraph(report.componentSummaries.s_id);
    }

    if (report.componentIndicators.s_id.length > 0) {
      this.addSubsection('Identity indicators');
      this.addBulletList(report.componentIndicators.s_id);
    }
  }

  private addMatrixRow(
    label: string,
    score: number | null,
    explanation: string,
  ): void {
    if (score !== null) {
      this.drawProgressBar(label, score, 'higher');
    } else {
      this.addParameter(label, 'Not evaluated');
    }
    this.addParagraph(explanation);
    this.y -= SPACING.tight;
  }

  private addPlatformProfile(
    platform: CandidateReportDto['linkedin'],
    url: string | null | undefined,
  ): void {
    this.addParameter('Status', platform.statusLabel);
    if (platform.handle) {
      this.addParameter('Handle', platform.handle);
    }
    if (url) {
      this.addParameter('URL', url);
    }
    if (!platform.provided) {
      this.addParagraph('Not provided for cross-reference.');
    }
    this.y -= SPACING.tight;
  }

  private addSupplementaryAnalysis(
    title: string,
    analysis: SupplementaryAnalysis,
    showMotivation = false,
  ): void {
    this.addSection(title);
    this.addParagraph(
      'Supplementary hiring context only. Not included in the hiring integrity score.',
    );
    this.addParagraph(analysis.summary);

    if (analysis.detail) {
      this.addSubsection(analysis.detailLabel);
      this.addParagraph(analysis.detail);
    }

    if (analysis.traits.length > 0) {
      this.addSubsection('Observed traits');
      this.addBulletList(analysis.traits);
    }

    if (analysis.indicators.length > 0) {
      this.addSubsection('Indicators');
      this.addBulletList(analysis.indicators);
    }

    if (showMotivation && analysis.motivationSignals.length > 0) {
      this.addSubsection('Motivation signals');
      this.addBulletList(analysis.motivationSignals);
    }

    if (analysis.concerns.length > 0) {
      this.addSubsection('Watchpoints');
      this.addBulletList(analysis.concerns);
    }
  }

  private addInterviewAnalysis(report: CandidateReportDto): void {
    this.addSection('Interview analysis');
    this.addParameter('Rounds recorded', String(report.rounds.length));
    this.addParameter(
      'Truncated rounds',
      String(report.rounds.filter((round) => round.wasTruncated).length),
    );
    this.drawProgressBar('Confidence variance', report.interviewVariance, 'lower');
    this.addParameter(
      'Prompt injection risk',
      report.interviewVariance > 40 ? 'Elevated' : 'Low',
    );

    if (report.componentSummaries.s_int) {
      this.addSubsection('Interview summary');
      this.addParagraph(report.componentSummaries.s_int);
    }

    if (report.componentIndicators.s_int.length > 0) {
      this.addSubsection('Interview indicators');
      this.addBulletList(report.componentIndicators.s_int);
    }

    if (report.rounds.length === 0) {
      this.addParagraph('No interview transcript recorded for this candidate.');
      return;
    }

    for (const round of report.rounds) {
      this.addSubsection(`Round ${round.roundNumber}`);
      if (round.sInt !== null) {
        this.drawProgressBar('Interview score', round.sInt, 'higher');
      }
      if (round.sId !== null) {
        this.drawProgressBar('Identity score', round.sId, 'higher');
      }
      this.addParameter(
        'Variance delta',
        round.varianceDelta !== null ? String(round.varianceDelta) : '—',
      );

      if (round.wasTruncated) {
        this.addParagraph('Response was truncated mid-answer.');
      }

      if (round.observations.length > 0) {
        this.addSubsection('Observations');
        this.addBulletList(round.observations);
      }

      if (round.deepDivePrompts.length > 0) {
        this.addSubsection('Suggested deep-dive prompts');
        this.addBulletList(round.deepDivePrompts);
      }
    }
  }

  private addFlags(report: CandidateReportDto): void {
    if (report.flags.length === 0) return;

    this.addSection('Active flags');
    for (const flag of report.flags) {
      this.drawFlag(flag.severity, flag.description, flag.confidence);
    }
    this.y -= SPACING.tight;
  }

  private drawFlag(
    severity: string,
    description: string,
    confidence: number,
  ): void {
    const normalized = severity.toLowerCase();
    const accent =
      normalized === 'critical' || normalized === 'error'
        ? COLORS.critical
        : normalized === 'warning'
          ? COLORS.warning
          : COLORS.info;

    const meta = `${severity.toUpperCase()} · ${Math.round(confidence * 100)}% confidence`;
    const descriptionLines = this.wrapLines(description, TYPE.body, this.regularFont);
    const boxHeight = 18 + descriptionLines.length * 12 + 12;
    this.ensureSpace(boxHeight + SPACING.item);

    const boxTop = this.y;
    const boxBottom = boxTop - boxHeight;
    const inset = 12;

    this.page.drawRectangle({
      x: MARGIN,
      y: boxBottom,
      width: CONTENT_WIDTH,
      height: boxHeight,
      color: COLORS.panel,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    this.page.drawRectangle({
      x: MARGIN,
      y: boxBottom,
      width: 3,
      height: boxHeight,
      color: accent,
    });

    this.page.drawText(meta, {
      x: MARGIN + inset,
      y: boxTop - 14,
      size: TYPE.label,
      font: this.boldFont,
      color: accent,
    });

    let textY = boxTop - 28;
    for (const line of descriptionLines) {
      this.page.drawText(line, {
        x: MARGIN + inset,
        y: textY,
        size: TYPE.body,
        font: this.regularFont,
        color: COLORS.text,
      });
      textY -= 12;
    }

    this.y = boxBottom - SPACING.item;
  }

  private drawParameterPanel(
    rows: Array<{ label: string; value: string }>,
  ): void {
    if (rows.length === 0) return;

    const rowHeight = TYPE.param + SPACING.item + 4;
    const panelHeight = rows.length * rowHeight + 16;
    this.ensureSpace(panelHeight);

    const panelTop = this.y;
    const panelBottom = panelTop - panelHeight;

    this.page.drawRectangle({
      x: MARGIN,
      y: panelBottom,
      width: CONTENT_WIDTH,
      height: panelHeight,
      color: COLORS.panel,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    let rowY = panelTop - 12;
    for (const row of rows) {
      this.page.drawText(sanitizePdfText(row.label), {
        x: MARGIN + 12,
        y: rowY - TYPE.param,
        size: TYPE.param,
        font: this.regularFont,
        color: COLORS.muted,
      });

      const valueWidth = this.boldFont.widthOfTextAtSize(row.value, TYPE.param);
      this.page.drawText(row.value, {
        x: PAGE_WIDTH - MARGIN - 12 - valueWidth,
        y: rowY - TYPE.param,
        size: TYPE.param,
        font: this.boldFont,
        color: COLORS.text,
      });

      rowY -= rowHeight;
    }

    this.y = panelBottom - SPACING.tight;
  }

  private drawCalloutPanel(title: string, body: string): void {
    const bodyLines = this.wrapLines(body, TYPE.body, this.regularFont);
    const panelHeight = 28 + bodyLines.length * 12 + 12;
    this.ensureSpace(panelHeight);

    const panelTop = this.y;
    const panelBottom = panelTop - panelHeight;

    this.page.drawRectangle({
      x: MARGIN,
      y: panelBottom,
      width: CONTENT_WIDTH,
      height: panelHeight,
      color: COLORS.panel,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    this.page.drawText(sanitizePdfText(title), {
      x: MARGIN + 12,
      y: panelTop - 14,
      size: TYPE.subsection,
      font: this.boldFont,
      color: COLORS.text,
    });

    let textY = panelTop - 30;
    for (const line of bodyLines) {
      this.page.drawText(line, {
        x: MARGIN + 12,
        y: textY,
        size: TYPE.body,
        font: this.regularFont,
        color: COLORS.muted,
      });
      textY -= 12;
    }

    this.y = panelBottom - SPACING.block;
  }

  private drawProgressBar(
    label: string,
    value: number,
    direction: ProgressDirection,
  ): void {
    const pct = Math.min(100, Math.max(0, value));
    const invert = direction === 'lower';
    this.ensureSpace(SPACING.progressBar);

    this.page.drawText(sanitizePdfText(label), {
      x: MARGIN,
      y: this.y,
      size: TYPE.param,
      font: this.boldFont,
      color: COLORS.text,
    });

    const hint =
      direction === 'lower' ? 'Lower is better' : 'Higher is better';
    this.page.drawText(hint, {
      x: MARGIN,
      y: this.y - 10,
      size: TYPE.hint,
      font: this.regularFont,
      color: COLORS.label,
    });

    const valueText = `${Math.round(pct)}%`;
    const valueWidth = this.boldFont.widthOfTextAtSize(valueText, TYPE.param);
    this.page.drawText(valueText, {
      x: PAGE_WIDTH - MARGIN - valueWidth,
      y: this.y,
      size: TYPE.param,
      font: this.boldFont,
      color: this.scoreColor(pct, invert),
    });

    const barY = this.y - 22;
    const barHeight = 6;
    this.page.drawRectangle({
      x: MARGIN,
      y: barY,
      width: CONTENT_WIDTH,
      height: barHeight,
      color: COLORS.track,
    });
    this.page.drawRectangle({
      x: MARGIN,
      y: barY,
      width: (CONTENT_WIDTH * pct) / 100,
      height: barHeight,
      color: this.scoreColor(pct, invert),
    });

    this.y = barY - SPACING.block;
  }

  private drawDistributionBar(
    label: string,
    count: number,
    total: number,
    color: RGB,
  ): void {
    const pct = total > 0 ? (count / total) * 100 : 0;
    this.ensureSpace(SPACING.progressBar);

    this.page.drawText(sanitizePdfText(label), {
      x: MARGIN,
      y: this.y,
      size: TYPE.param,
      font: this.boldFont,
      color: COLORS.text,
    });

    this.page.drawText('Share of scored candidates', {
      x: MARGIN,
      y: this.y - 10,
      size: TYPE.hint,
      font: this.regularFont,
      color: COLORS.label,
    });

    const valueText = String(count);
    const valueWidth = this.boldFont.widthOfTextAtSize(valueText, TYPE.param);
    this.page.drawText(valueText, {
      x: PAGE_WIDTH - MARGIN - valueWidth,
      y: this.y,
      size: TYPE.param,
      font: this.boldFont,
      color,
    });

    const barY = this.y - 22;
    const barHeight = 6;
    this.page.drawRectangle({
      x: MARGIN,
      y: barY,
      width: CONTENT_WIDTH,
      height: barHeight,
      color: COLORS.track,
    });
    this.page.drawRectangle({
      x: MARGIN,
      y: barY,
      width: (CONTENT_WIDTH * pct) / 100,
      height: barHeight,
      color,
    });

    this.y = barY - SPACING.block;
  }

  private drawStamp(): void {
    const stampWidth = 132;
    const stampHeight = 52;
    const x = PAGE_WIDTH - MARGIN - stampWidth;
    const y = MARGIN + 72;

    this.page.drawRectangle({
      x,
      y,
      width: stampWidth,
      height: stampHeight,
      borderColor: COLORS.primary,
      borderWidth: 2,
      opacity: 0.85,
    });

    const stampText = 'CERTALYTIC';
    const textWidth = this.boldFont.widthOfTextAtSize(stampText, 14);
    this.page.drawText(stampText, {
      x: x + stampWidth / 2 - textWidth / 2,
      y: y + stampHeight / 2 - 4,
      size: 14,
      font: this.boldFont,
      color: COLORS.primary,
      opacity: 0.85,
    });

    const subText = 'INTEGRITY DOSSIER';
    const subWidth = this.regularFont.widthOfTextAtSize(subText, TYPE.hint);
    this.page.drawText(subText, {
      x: x + stampWidth / 2 - subWidth / 2,
      y: y + 10,
      size: TYPE.hint,
      font: this.regularFont,
      color: COLORS.muted,
      opacity: 0.85,
    });
  }

  private wrapLines(
    text: string,
    size: number,
    font: PDFFont,
    maxWidth = CONTENT_WIDTH - 24,
  ): string[] {
    const words = sanitizePdfText(text).split(/\s+/);
    const lines: string[] = [];
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);

    return lines;
  }

  private drawDivider(): void {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 1,
      color: COLORS.border,
    });
  }

  private scoreColor(pct: number, invert = false): RGB {
    const isGood = invert ? pct < 30 : pct > 70;
    const isMedium = invert ? pct < 60 : pct > 40;

    return isGood ? COLORS.high : isMedium ? COLORS.medium : COLORS.low;
  }

  private levelColor(level: string): RGB {
    switch (level) {
      case 'high':
        return COLORS.high;
      case 'medium':
        return COLORS.medium;
      default:
        return COLORS.low;
    }
  }

  private drawText(
    text: string,
    size: number,
    font: PDFFont,
    color: RGB = COLORS.text,
  ): void {
    this.page.drawText(sanitizePdfText(text), {
      x: MARGIN,
      y: this.y,
      size,
      font,
      color,
    });
    this.y -= size + SPACING.tight;
  }

  private drawWrappedText(
    text: string,
    size: number,
    font: PDFFont,
    color: RGB = COLORS.text,
  ): void {
    const words = sanitizePdfText(text).split(/\s+/);
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);

      if (width > CONTENT_WIDTH && line) {
        this.ensureSpace(size + SPACING.tight);
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y,
          size,
          font,
          color,
        });
        this.y -= size + SPACING.tight;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      this.ensureSpace(size + SPACING.tight);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font,
        color,
      });
      this.y -= size + SPACING.tight;
    }
  }

  private startNewPage(): void {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(required: number): void {
    if (this.y - required < MARGIN) {
      this.startNewPage();
    }
  }
}
