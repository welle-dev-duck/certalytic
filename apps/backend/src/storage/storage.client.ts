import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { productConfig } from '../config/product';

export type StorageClient = {
  putObject(
    key: string,
    body: Buffer,
    contentType?: string,
  ): Promise<void>;
  getObject(key: string): Promise<Buffer | null>;
  deleteObject(key: string): Promise<void>;
  signedUrl(key: string, expiresInSeconds?: number): Promise<string>;
};

function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    return Promise.resolve(Buffer.alloc(0));
  }

  if (Buffer.isBuffer(body)) {
    return Promise.resolve(body);
  }

  if (body instanceof Uint8Array) {
    return Promise.resolve(Buffer.from(body));
  }

  if (typeof body === 'string') {
    return Promise.resolve(Buffer.from(body));
  }

  if (
    typeof body === 'object' &&
    body !== null &&
    'transformToByteArray' in body &&
    typeof body.transformToByteArray === 'function'
  ) {
    return body.transformToByteArray().then((bytes: Uint8Array) =>
      Buffer.from(bytes),
    );
  }

  const stream = body as AsyncIterable<Uint8Array>;
  const chunks: Buffer[] = [];

  return (async () => {
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  })();
}

export class S3StorageClient implements StorageClient {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    const { s3 } = productConfig;

    this.bucket = s3.bucket;
    this.client = new S3Client({
      region: s3.region,
      credentials:
        s3.accessKeyId && s3.secretAccessKey
          ? {
              accessKeyId: s3.accessKeyId,
              secretAccessKey: s3.secretAccessKey,
            }
          : undefined,
      endpoint: s3.endpoint,
      forcePathStyle: s3.usePathStyleEndpoint,
    });
  }

  async putObject(
    key: string,
    body: Buffer,
    contentType?: string,
  ): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async getObject(key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );

      const buffer = await streamToBuffer(response.Body);

      return buffer.length > 0 ? buffer : null;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'NoSuchKey'
      ) {
        return null;
      }

      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async signedUrl(
    key: string,
    expiresInSeconds = productConfig.storage.signedUrlTtlMinutes * 60,
  ): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      { expiresIn: expiresInSeconds },
    );
  }
}

export function createStorageClient(): StorageClient {
  return new S3StorageClient();
}
