import { Router } from "express";
import { z } from "zod";
import {
  authenticate,
  createAccessToken,
  hashPassword,
  verifyPassword,
} from "../auth.js";
import {
  type User,
  createUser,
  getUserById,
  getUserByUsername,
  isUniqueViolation,
  updateUserAvatarKey,
} from "../db.js";
import { AppError } from "../error.js";
import { imageStorage } from "../images/provider.js";
import { saveUploadedImage, uploadImage } from "../images/upload.js";
import { MAX_POSTGRES_INTEGER } from "../utils.js";
import { parse } from "../validation.js";

const router = Router();

function toUserResponse(user: User) {
  const { password_hash, avatar_key, ...publicUser } = user;

  return {
    ...publicUser,
    avatar_url: avatar_key ? imageStorage.getPublicUrl(avatar_key) : null,
  };
}

const UserIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_POSTGRES_INTEGER);

router.get("/me", authenticate, async (req, res) => {
  const user = await getUserById(req.auth!.userId);

  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  res.json(toUserResponse(user));
});

router.post("/me/avatar", authenticate, uploadImage, async (req, res) => {
  const userId = req.auth!.userId;
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  const avatarKey = await saveUploadedImage(req, "avatars");
  const updatedUser = await updateUserAvatarKey(userId, avatarKey);

  if (!updatedUser) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  if (user.avatar_key) {
    await imageStorage.delete(user.avatar_key);
  }

  res.json(toUserResponse(updatedUser));
});

router.get("/:userId", async (req, res) => {
  const userId = parse(UserIdSchema, req.params.userId);
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  res.json(toUserResponse(user));
});

const optionalNickname = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z
    .string()
    .trim()
    .min(2, { error: "Nickname must be at least 2 characters." })
    .max(30, { error: "Nickname must be at most 30 characters." })
    .regex(/^[\p{L}\p{M}\p{N} ._'-]+$/u, {
      error: "Nickname contains unsupported characters.",
    })
    .optional(),
);

const username = z.string().regex(/^[A-Za-z0-9]{3,20}$/, {
  error:
    "Username must be 3–20 characters using only English letters and numbers.",
});

const password = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(128, { error: "Password must be at most 128 characters." });

export const UserInput = z.object({
  username,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Enter a valid email address." })),
  password,
  nickname: optionalNickname,
});

router.post("/registration", async (req, res) => {
  const { password, ...userInput } = parse(UserInput, req.body);
  const passwordHash = await hashPassword(password);
  let user: User;

  try {
    user = await createUser({
      ...userInput,
      password_hash: passwordHash,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        409,
        "ACCOUNT_ALREADY_EXISTS",
        "An account with those details already exists",
      );
    }

    throw error;
  }

  const publicUser = toUserResponse(user);

  res.status(201).location(`/users/${publicUser.user_id}`).json(publicUser);
});

// TODO: support sign in using either email or username
const SignInInput = z.object({
  username,
  password,
});

router.post("/signin", async (req, res) => {
  const { username, password } = parse(SignInInput, req.body);
  const user = await getUserByUsername(username);

  if (!user) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid username or password",
    );
  }

  const valid = await verifyPassword(user.password_hash, password);

  if (!valid) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid username or password",
    );
  }

  const publicUser = toUserResponse(user);
  const accessToken = createAccessToken(publicUser.user_id);

  res.json({
    message: "Login successful",
    accessToken,
    user: publicUser,
  });
});

export default router;
