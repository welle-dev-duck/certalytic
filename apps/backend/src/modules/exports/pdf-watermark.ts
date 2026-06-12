import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function applyPdfWatermark(
  pdfBytes: Uint8Array,
  prominent: boolean,
): Promise<Uint8Array> {
  const document = await PDFDocument.load(pdfBytes);
  const font = await document.embedFont(StandardFonts.HelveticaBold);
  const opacity = prominent ? 0.14 : 0.08;

  for (const page of document.getPages()) {
    const { width, height } = page.getSize();

    page.drawText('CERTALYTIC', {
      x: width / 2 - 100,
      y: height / 2,
      size: 48,
      font,
      color: rgb(0.18, 0.36, 0.33),
      opacity,
      rotate: degrees(-45),
    });
  }

  return document.save();
}
