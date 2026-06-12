import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

import type { CandidateReportDto } from '../candidates/candidates.dto';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 40;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

type SupplementaryAnalysis = CandidateReportDto['behaviourAnalysis'];

export class PdfDocumentBuilder {
  private document!: PDFDocument;
  private page!: PDFPage;
  private regularFont!: PDFFont;
  private boldFont!: PDFFont;
  private y = PAGE_HEIGHT - MARGIN;

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

  addBrandHeader(title: string, subtitle: string): void {
    this.drawText(
      'CERTALYTIC · INTEGRITY DOSSIER',
      9,
      this.boldFont,
      rgb(0.18, 0.36, 0.33),
    );
    this.y -= 18;
    this.drawText(title, 18, this.boldFont);
    this.y -= 16;
    this.drawText(subtitle, 10, this.regularFont, rgb(0.36, 0.44, 0.41));
    this.y -= 20;
  }

  addDisclaimer(): void {
    this.ensureSpace(48);
    const text =
      'This score represents a probability heuristic, not an absolute verdict. Use it to guide your human follow-up questions.';
    this.drawWrappedText(text, 9, this.regularFont, rgb(0.33, 0.29, 0.07));
    this.y -= 12;
  }

  addRoleSection(title: string, description?: string | null): void {
    this.addSection('Role');
    this.addKeyValue('Title', title);
    if (description?.trim()) {
      this.addSubsection('Job description');
      this.addParagraph(description.trim());
    }
  }

  addSection(title: string): void {
    this.ensureSpace(24);
    this.drawText(title, 12, this.boldFont);
    this.y -= 4;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 1,
      color: rgb(0.77, 0.83, 0.81),
    });
    this.y -= 14;
  }

  addSubsection(title: string): void {
    this.ensureSpace(18);
    this.drawText(title, 10, this.boldFont);
    this.y -= 6;
  }

  addScoreBox(score: number, level: string): void {
    this.ensureSpace(70);
    const boxHeight = 56;
    const boxTop = this.y;

    this.page.drawRectangle({
      x: MARGIN,
      y: boxTop - boxHeight,
      width: CONTENT_WIDTH,
      height: boxHeight,
      borderColor: rgb(0.18, 0.36, 0.33),
      borderWidth: 2,
    });

    const scoreText = String(score);
    const scoreWidth = this.boldFont.widthOfTextAtSize(scoreText, 28);

    this.page.drawText(scoreText, {
      x: MARGIN + CONTENT_WIDTH / 2 - scoreWidth / 2,
      y: boxTop - 36,
      size: 28,
      font: this.boldFont,
      color: rgb(0.18, 0.36, 0.33),
    });

    const levelText = `Integrity level: ${level}`;
    const levelWidth = this.regularFont.widthOfTextAtSize(levelText, 10);

    this.page.drawText(levelText, {
      x: MARGIN + CONTENT_WIDTH / 2 - levelWidth / 2,
      y: boxTop - 50,
      size: 10,
      font: this.regularFont,
      color: rgb(0.36, 0.44, 0.41),
    });

    this.y = boxTop - boxHeight - 16;
  }

  addKeyValue(label: string, value: string): void {
    this.ensureSpace(16);
    this.drawText(`${label}: ${value}`, 10, this.regularFont);
    this.y -= 4;
  }

  addParagraph(text: string): void {
    this.drawWrappedText(text, 9, this.regularFont);
    this.y -= 6;
  }

  addBulletList(items: string[]): void {
    for (const item of items) {
      this.drawWrappedText(`• ${item}`, 9, this.regularFont);
      this.y -= 2;
    }
    this.y -= 4;
  }

  addCandidateReport(
    candidateName: string,
    report: CandidateReportDto,
    metadata?: CandidatePdfMetadata,
  ): void {
    this.addSection(candidateName);
    this.addScoreBox(report.score, report.level);

    if (metadata) {
      this.addCandidateMetadata(metadata);
    }

    this.addSignalSummary(report);
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

  private addCandidateMetadata(metadata: CandidatePdfMetadata): void {
    this.addSubsection('Candidate details');
    if (metadata.email) {
      this.addKeyValue('Email', metadata.email);
    }
    if (metadata.linkedinUrl) {
      this.addKeyValue('LinkedIn', metadata.linkedinUrl);
    }
    if (metadata.githubUsername) {
      this.addKeyValue('GitHub', metadata.githubUsername);
    }
    this.y -= 4;
  }

  private addSignalSummary(report: CandidateReportDto): void {
    this.addSection('Signal summary');
    this.addSubsection(report.verdict.title);
    this.addParagraph(report.verdict.body);
    this.addSubsection('Signal vector scores');
    for (const { subject, value } of report.radar) {
      this.addKeyValue(subject, `${value}%`);
    }
    this.addSubsection('Component scores');
    this.addKeyValue('CV signal', `${report.subScores.s_cv}%`);
    this.addKeyValue('Interview signal', `${report.subScores.s_int}%`);
    if (report.subScores.s_cross !== null) {
      this.addKeyValue('Cross-source signal', `${report.subScores.s_cross}%`);
    }
    this.addKeyValue('Identity signal', `${report.subScores.s_id}%`);
    this.addKeyValue('Response score', `${report.responseScore}%`);
  }

  private addCvAnalysis(report: CandidateReportDto): void {
    this.addSection('CV analysis');
    this.addKeyValue('AI-generated text probability', `${report.aiTextPercent}%`);
    this.addKeyValue('CV authorship score', `${report.subScores.s_cv}%`);

    if (report.componentSummaries.s_cv) {
      this.addSubsection('Analysis summary');
      this.addParagraph(report.componentSummaries.s_cv);
    }

    if (report.componentIndicators.s_cv.length > 0) {
      this.addSubsection('Indicators');
      this.addBulletList(report.componentIndicators.s_cv);
    }

    if (report.riskVectors.length > 0) {
      this.addSubsection('Risk vectors');
      for (const vector of report.riskVectors) {
        this.addKeyValue(vector.name, `${vector.value}%`);
      }
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
    this.addKeyValue(label, score !== null ? `${score}%` : 'Not evaluated');
    this.addParagraph(explanation);
    this.y -= 2;
  }

  private addPlatformProfile(
    platform: CandidateReportDto['linkedin'],
    url: string | null | undefined,
  ): void {
    this.addKeyValue('Status', platform.statusLabel);
    if (platform.handle) {
      this.addKeyValue('Handle', platform.handle);
    }
    if (url) {
      this.addKeyValue('URL', url);
    }
    if (!platform.provided) {
      this.addParagraph('Not provided for cross-reference.');
    }
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
    this.addKeyValue('Rounds recorded', String(report.rounds.length));
    this.addKeyValue(
      'Truncated rounds',
      String(report.rounds.filter((round) => round.wasTruncated).length),
    );
    this.addKeyValue('Confidence variance', `${report.interviewVariance}%`);
    this.addKeyValue(
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
      this.addKeyValue(
        'Interview score',
        round.sInt !== null ? `${round.sInt}%` : 'n/a',
      );
      this.addKeyValue(
        'Identity score',
        round.sId !== null ? `${round.sId}%` : 'n/a',
      );
      this.addKeyValue(
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
      this.drawWrappedText(
        `[${flag.severity.toUpperCase()} · ${Math.round(flag.confidence * 100)}% confidence] ${flag.description}`,
        9,
        this.regularFont,
      );
      this.y -= 4;
    }
  }

  private drawText(
    text: string,
    size: number,
    font: PDFFont,
    color = rgb(0.1, 0.18, 0.16),
  ): void {
    this.page.drawText(sanitizePdfText(text), {
      x: MARGIN,
      y: this.y,
      size,
      font,
      color,
    });
    this.y -= size + 6;
  }

  private drawWrappedText(
    text: string,
    size: number,
    font: PDFFont,
    color = rgb(0.1, 0.18, 0.16),
  ): void {
    const words = sanitizePdfText(text).split(/\s+/);
    let line = '';

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, size);

      if (width > CONTENT_WIDTH && line) {
        this.ensureSpace(size + 6);
        this.page.drawText(line, {
          x: MARGIN,
          y: this.y,
          size,
          font,
          color,
        });
        this.y -= size + 4;
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) {
      this.ensureSpace(size + 6);
      this.page.drawText(line, {
        x: MARGIN,
        y: this.y,
        size,
        font,
        color,
      });
      this.y -= size + 4;
    }
  }

  private ensureSpace(required: number): void {
    if (this.y - required < MARGIN) {
      this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      this.y = PAGE_HEIGHT - MARGIN;
    }
  }
}
