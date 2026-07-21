import { type Request, type RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../error.js";
import { imageStorage } from "./provider.js";
import { parseUploadedImage, type ImageScope } from "./storage.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadImage: RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (!(error instanceof multer.MulterError)) {
      next(error);
      return;
    }

    const tooLarge = error.code === "LIMIT_FILE_SIZE";
    next(
      new AppError(
        tooLarge ? 413 : 400,
        tooLarge ? "IMAGE_TOO_LARGE" : "INVALID_IMAGE_UPLOAD",
        tooLarge
          ? "Image must be no larger than 5 MB"
          : "Send one image in the image field",
      ),
    );
  });
};

export async function saveUploadedImage(
  req: Request,
  scope: ImageScope,
): Promise<string> {
  if (!req.file) {
    throw new AppError(400, "IMAGE_REQUIRED", "Image file is required");
  }

  const image = await parseUploadedImage(req.file.buffer);
  const { key } = await imageStorage.save(scope, image);
  return key;
}
