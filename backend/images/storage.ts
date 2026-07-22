import { randomUUID } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { AppError } from "../error.js";

export const IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageContentType = keyof typeof IMAGE_EXTENSIONS;

export interface UploadedFile {
  bytes: Buffer;
  contentType: ImageContentType;
}

export const IMAGE_SCOPES = ["products", "avatars"] as const;

export type ImageScope = (typeof IMAGE_SCOPES)[number];

export interface ImageStorage {
  save(scope: ImageScope, file: UploadedFile): Promise<{ key: string }>;
  getPublicUrl(key: string): string;
  delete(key: string): Promise<void>;
}

export function isImageContentType(value: string): value is ImageContentType {
  return Object.hasOwn(IMAGE_EXTENSIONS, value);
}

export function isImageScope(value: unknown): value is ImageScope {
  return (
    typeof value === "string" &&
    (IMAGE_SCOPES as readonly string[]).includes(value)
  );
}

export function validateImageKey(key: string): void {
  const [scope, filename, extra] = key.split("/");

  if (!isImageScope(scope) || !filename || extra !== undefined) {
    throw new Error("Invalid image key");
  }
}

export function createImageKey(
  scope: ImageScope,
  contentType: ImageContentType,
): string {
  return `${scope}/${randomUUID()}.${IMAGE_EXTENSIONS[contentType]}`;
}

export function getImagePublicUrl(publicBaseUrl: string, key: string): string {
  validateImageKey(key);
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${publicBaseUrl.replace(/\/+$/, "")}/${encodedKey}`;
}

export async function parseUploadedImage(bytes: Buffer): Promise<UploadedFile> {
  const detected = await fileTypeFromBuffer(bytes);

  if (!detected || !isImageContentType(detected.mime)) {
    throw new AppError(
      400,
      "UNSUPPORTED_IMAGE_TYPE",
      "Only JPEG, PNG, and WebP images are supported",
    );
  }

  return { bytes, contentType: detected.mime };
}
