import {
  DeleteObjectCommand,
  PutObjectCommand,
  type S3Client,
} from "@aws-sdk/client-s3";
import {
  validateImageKey,
  createImageKey,
  getImagePublicUrl,
  type ImageScope,
  type ImageStorage,
  type UploadedFile,
} from "./storage.js";

export interface S3ImageStorageOptions {
  client: S3Client;
  bucket: string;
  publicBaseUrl: string;
}

export class S3ImageStorage implements ImageStorage {
  constructor(private readonly options: S3ImageStorageOptions) {}

  async save(scope: ImageScope, file: UploadedFile): Promise<{ key: string }> {
    const key = createImageKey(scope, file.contentType);

    await this.options.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: file.bytes,
        ContentType: file.contentType,
      }),
    );

    return { key };
  }

  getPublicUrl(key: string): string {
    return getImagePublicUrl(this.options.publicBaseUrl, key);
  }

  async delete(key: string): Promise<void> {
    validateImageKey(key);
    await this.options.client.send(
      new DeleteObjectCommand({ Bucket: this.options.bucket, Key: key }),
    );
  }
}
