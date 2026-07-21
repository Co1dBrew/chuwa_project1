import fs from "node:fs/promises";
import path from "node:path";
import {
  validateImageKey,
  createImageKey,
  getImagePublicUrl,
  type ImageScope,
  type ImageStorage,
  type UploadedFile,
} from "./storage.js";

export const LOCAL_UPLOAD_DIRECTORY = path.resolve("uploads");

export class LocalImageStorage implements ImageStorage {
  constructor(
    private readonly uploadDirectory = LOCAL_UPLOAD_DIRECTORY,
    private readonly publicBaseUrl = "http://localhost:3000/media",
  ) {}

  async save(scope: ImageScope, file: UploadedFile): Promise<{ key: string }> {
    const key = createImageKey(scope, file.contentType);
    const filePath = this.pathFor(key);

    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, file.bytes, { flag: "wx" });

    return { key };
  }

  getPublicUrl(key: string): string {
    return getImagePublicUrl(this.publicBaseUrl, key);
  }

  async delete(key: string): Promise<void> {
    await fs.rm(this.pathFor(key), { force: true });
  }

  private pathFor(key: string): string {
    validateImageKey(key);

    const filePath = path.resolve(this.uploadDirectory, key);
    const relativePath = path.relative(this.uploadDirectory, filePath);

    // The file must remain inside the configured upload directory.
    if (
      !relativePath ||
      relativePath.startsWith("..") ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error("Invalid image key");
    }

    return filePath;
  }
}
