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

type PdfDocumentBuilderOptions = {
  watermarked: boolean;
};

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
    this.drawText('CERTALYTIC · INTEGRITY DOSSIER', 9, this.boldFont, rgb(0.18, 0.36, 0.33));
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

  addCandidateReport(
    candidateName: string,
    report: CandidateReportDto,
    showFullBreakdown: boolean,
  ): void {
    this.addSection(candidateName);
    this.addScoreBox(report.score, report.level);

    this.addKeyValue('CV signal', String(report.subScores.s_cv));
    this.addKeyValue('Interview signal', String(report.subScores.s_int));
    if (report.subScores.s_cross !== null) {
      this.addKeyValue('Cross-source signal', String(report.subScores.s_cross));
    }
    this.addKeyValue('Identity signal', String(report.subScores.s_id));

    if (report.flags.length > 0) {
      this.addSection('Flags');
      for (const flag of report.flags) {
        this.drawWrappedText(
          `[${flag.severity}] ${flag.description}`,
          9,
          this.regularFont,
        );
        this.y -= 4;
      }
    }

    if (showFullBreakdown && report.rounds.length > 0) {
      this.addSection('Interview rounds');
      for (const round of report.rounds) {
        this.drawWrappedText(
          `Round ${round.roundNumber}: interview ${round.sInt ?? '—'}, identity ${round.sId ?? '—'}`,
          9,
          this.regularFont,
        );
        this.y -= 4;
      }
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

  private drawText(
    text: string,
    size: number,
    font: PDFFont,
    color = rgb(0.1, 0.18, 0.16),
  ): void {
    this.page.drawText(text, {
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
    const words = text.split(/\s+/);
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
