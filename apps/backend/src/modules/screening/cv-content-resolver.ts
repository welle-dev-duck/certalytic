import path from 'node:path';

import type { CvFormat } from '../../db/schema/candidates.schema';
import { limitCvText } from '../../lib/text-content-limiter';
import { readDocxFromBuffer } from '../../lib/docx';
import type { DocumentExtractor } from '../mistral/document-extractor';
import type { StorageClient } from '../../storage/storage.client';

type CandidateCvSource = {
  cvText: string | null;
  cvPath: string | null;
  cvFormat: CvFormat | null;
};

export class CvContentResolver {
  constructor(
    private readonly storage: StorageClient,
    private readonly documentExtractor: DocumentExtractor,
  ) {}

  async resolve(candidate: CandidateCvSource): Promise<string> {
    if (candidate.cvText && candidate.cvText.trim() !== '') {
      return limitCvText(candidate.cvText).text;
    }

    if (!candidate.cvPath) {
      throw new Error('Candidate has no CV content to process.');
    }

    const format = candidate.cvFormat ?? 'pdf';
    const text = await this.extractFromPath(candidate.cvPath, format);

    return limitCvText(text).text;
  }

  private async extractFromPath(
    storagePath: string,
    format: CvFormat,
  ): Promise<string> {
    switch (format) {
      case 'pdf':
        return this.documentExtractor.extractPdfText(storagePath);
      case 'docx': {
        const contents = await this.storage.getObject(storagePath);

        if (!contents) {
          throw new Error(`CV document not found at path: ${storagePath}`);
        }

        return readDocxFromBuffer(contents);
      }
      case 'markdown': {
        const contents = await this.storage.getObject(storagePath);

        if (!contents || contents.toString('utf8').trim() === '') {
          throw new Error(
            `CV document not found or empty at path: ${storagePath}`,
          );
        }

        return contents.toString('utf8');
      }
      case 'text':
        throw new Error('Text CVs must be stored in cv_text.');
      default:
        throw new Error(`Unsupported CV format: ${format}`);
    }
  }

  static detectCvFormat(filename: string): CvFormat {
    const extension = path.extname(filename).replace(/^\./, '').toLowerCase();

    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'doc':
      case 'docx':
        return 'docx';
      case 'md':
      case 'markdown':
        return 'markdown';
      case 'txt':
        return 'markdown';
      default:
        return 'pdf';
    }
  }
}
