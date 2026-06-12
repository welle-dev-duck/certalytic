import { readDocxFromBuffer } from '../../lib/docx';

export class CaptionFileParser {
  async parseContents(
    contents: Buffer | string,
    extension: string,
  ): Promise<string> {
    const normalized = extension.toLowerCase().replace(/^\./, '');

    switch (normalized) {
      case 'vtt':
        return this.parseVtt(
          typeof contents === 'string' ? contents : contents.toString('utf8'),
        );
      case 'doc':
      case 'docx':
        if (typeof contents === 'string') {
          throw new Error('DOCX transcript files must be provided as binary.');
        }

        return await readDocxFromBuffer(contents);
      case 'txt':
      case 'md':
      case 'markdown':
        return (
          typeof contents === 'string' ? contents : contents.toString('utf8')
        ).trim();
      default:
        throw new Error('Unsupported transcript file format.');
    }
  }

  private parseVtt(contents: string): string {
    const lines = contents.split(/\r?\n/u);
    const segments: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      if (
        trimmed === '' ||
        trimmed.startsWith('WEBVTT') ||
        trimmed.includes('-->')
      ) {
        continue;
      }

      if (/^[\d\s:.,-]+$/u.test(trimmed)) {
        continue;
      }

      segments.push(trimmed);
    }

    const text = segments.join('\n').trim();

    if (text === '') {
      throw new Error('VTT file did not contain readable caption text.');
    }

    return text;
  }
}
