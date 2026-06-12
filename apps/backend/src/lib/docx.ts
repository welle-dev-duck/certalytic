import JSZip from 'jszip';

export async function readDocxFromBuffer(contents: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(contents);
  const documentXml = await zip.file('word/document.xml')?.async('string');

  if (!documentXml) {
    throw new Error('Word document did not contain readable content.');
  }

  const text = documentXml
    .replaceAll('</w:p>', '\n')
    .replaceAll('</w:tr>', '\n')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&apos;/g, "'")
    .replaceAll(/&amp;/g, '&')
    .replaceAll(/&lt;/g, '<')
    .replaceAll(/&gt;/g, '>')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();

  if (text === '') {
    throw new Error('Word document did not contain readable content.');
  }

  return text;
}
