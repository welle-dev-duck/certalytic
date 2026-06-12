import {
  PDFDocument,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
  type RGB,
} from 'pdf-lib';

import {
  COLORS,
  CONTENT_WIDTH,
  MARGIN,
  PAGE_HEIGHT,
  PAGE_WIDTH,
  SPACING,
  TYPE,
  sanitizePdfText,
  type PdfDocumentBuilderOptions,
  type ProgressDirection,
} from './pdf-layout.constants';

export class PdfPageRenderer {
  protected document!: PDFDocument;
  protected page!: PDFPage;
  protected regularFont!: PDFFont;
  protected boldFont!: PDFFont;
  protected y = PAGE_HEIGHT - MARGIN;
  protected candidatePageStarted = false;

  constructor(protected readonly options: PdfDocumentBuilderOptions) {}

  async init(): Promise<void> {
    this.document = await PDFDocument.create();
    this.regularFont = await this.document.embedFont(StandardFonts.Helvetica);
    this.boldFont = await this.document.embedFont(StandardFonts.HelveticaBold);
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
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

  addSection(title: string): void {
    this.y -= SPACING.sectionTop;
    this.ensureSpace(32);
    this.drawText(title, TYPE.section, this.boldFont, COLORS.text);
    this.y -= SPACING.tight;
    this.drawDivider();
    this.y -= SPACING.sectionBottom;
  }

  addLabeledBlock(label: string): void {
    this.y -= SPACING.subsectionTop;
    this.ensureSpace(20);
    this.drawText(label.toUpperCase(), TYPE.label, this.boldFont, COLORS.label);
    this.y -= SPACING.subsectionBottom;
  }

  addSubsection(title: string): void {
    this.y -= SPACING.subsectionTop;
    this.ensureSpace(20);
    this.drawText(title, TYPE.subsection, this.boldFont, COLORS.text);
    this.y -= SPACING.subsectionBottom;
  }

  addIntegrityLevel(level: string): void {
    this.ensureSpace(20);
    const label = `Integrity level: ${level.toUpperCase()}`;
    this.drawText(label, TYPE.label, this.boldFont, this.levelColor(level));
    this.y -= SPACING.item;
  }

  addScoreBox(score: number, level: string): void {
    this.drawScoreBox(
      score,
      `Hiring integrity score · ${level}`,
      this.levelColor(level),
    );
  }

  drawScoreBox(
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

  addParameter(label: string, value: string): void {
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

  addParagraph(text: string): void {
    this.drawWrappedText(text, TYPE.body, this.regularFont, COLORS.text);
    this.y -= SPACING.paragraph;
  }

  addBulletList(items: string[]): void {
    for (const item of items) {
      this.drawWrappedText(`• ${item}`, TYPE.body, this.regularFont, COLORS.text);
      this.y -= SPACING.tight;
    }
    this.y -= SPACING.item;
  }

  shiftY(delta: number): void {
    this.y += delta;
  }

  drawFlag(
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

  drawParameterPanel(
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

  drawCalloutPanel(title: string, body: string): void {
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

  drawProgressBar(
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

  drawDistributionBar(
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

  drawStamp(): void {
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

  drawDivider(): void {
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 1,
      color: COLORS.border,
    });
  }

  scoreColor(pct: number, invert = false): RGB {
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

  drawText(
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

  drawWrappedText(
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

  startNewPage(): void {
    this.page = this.document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.y = PAGE_HEIGHT - MARGIN;
  }

  private ensureSpace(required: number): void {
    if (this.y - required < MARGIN) {
      this.startNewPage();
    }
  }
}
