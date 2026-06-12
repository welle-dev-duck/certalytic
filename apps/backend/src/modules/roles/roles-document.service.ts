import { eq } from 'drizzle-orm/sql';
import path from 'node:path';

import type { Database } from '../../db/index';
import { roleDocuments } from '../../db/schema/roles.schema';
import { readDocxFromBuffer } from '../../lib/docx';
import type { StorageClient } from '../../storage/storage.client';
import type { DocumentExtractor } from '../mistral/document-extractor';
import type { RoleDocumentJob } from './dtos/role-document-job.dto';

export class RolesDocumentService {
  constructor(
    private readonly db: Database,
    private readonly storage: StorageClient,
    private readonly documentExtractor: DocumentExtractor,
  ) {}

  async process(job: RoleDocumentJob): Promise<void> {
    const document = await this.db.query.roleDocuments.findFirst({
      where: eq(roleDocuments.id, job.documentId),
    });

    if (!document) {
      return;
    }

    await this.db
      .update(roleDocuments)
      .set({ ocrStatus: 'processing' })
      .where(eq(roleDocuments.id, document.id));

    try {
      const extension = path.extname(document.path).replace(/^\./, '').toLowerCase();
      const text = await this.extractText(document.path, extension);

      await this.db
        .update(roleDocuments)
        .set({
          extractedText: text,
          ocrStatus: 'complete',
        })
        .where(eq(roleDocuments.id, document.id));
    } catch (error) {
      await this.db
        .update(roleDocuments)
        .set({ ocrStatus: 'failed' })
        .where(eq(roleDocuments.id, document.id));

      throw error;
    }
  }

  private async extractText(
    storagePath: string,
    extension: string,
  ): Promise<string> {
    switch (extension) {
      case 'pdf':
        return this.documentExtractor.extractPdfText(storagePath);
      case 'doc':
      case 'docx': {
        const contents = await this.storage.getObject(storagePath);

        if (!contents) {
          throw new Error(`Role document not found at path: ${storagePath}`);
        }

        return readDocxFromBuffer(contents);
      }
      case 'md':
      case 'markdown':
      case 'txt': {
        const contents = await this.storage.getObject(storagePath);

        if (!contents || contents.toString('utf8').trim() === '') {
          throw new Error(
            `Role document not found or empty at path: ${storagePath}`,
          );
        }

        return contents.toString('utf8');
      }
      default:
        throw new Error('Unsupported role document format.');
    }
  }
}
