import type { StorageClient } from '../../storage/storage.client';
import { MistralClient } from './mistral.client';

export class DocumentExtractor {
  constructor(
    private readonly mistralClient: MistralClient,
    private readonly storage: StorageClient,
  ) {}

  async extractPdfText(path: string): Promise<string> {
    const contents = await this.storage.getObject(path);

    if (!contents) {
      throw new Error(`Document not found at path: ${path}`);
    }

    const response = await this.mistralClient.ocr(contents.toString('base64'));

    return this.mistralClient.parseOcrResponse(response);
  }
}
