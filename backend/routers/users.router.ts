import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import {
  authenticate,
  createAccessToken,
  createRefreshToken,
  getRefreshTokenUserId,
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

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  // Browser-visible path when Vite proxies /api to this router.
  path: "/api/users",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function getCookie(header: string | undefined, name: string) {
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (key === name) {
      try {
        return decodeURIComponent(valueParts.join("="));
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

function setRefreshCookie(res: Response, userId: number) {
  res.cookie(REFRESH_COOKIE_NAME, createRefreshToken(userId), REFRESH_COOKIE_OPTIONS);
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
    secure: REFRESH_COOKIE_OPTIONS.secure,
    path: REFRESH_COOKIE_OPTIONS.path,
  });
}

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
  role: z.enum(["customer", "merchant"]),
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

  setRefreshCookie(res, publicUser.user_id);

  res.json({
    message: "Login successful",
    accessToken,
    user: publicUser,
  });
});

router.post("/refresh", async (req, res) => {
  const refreshToken = getCookie(req.headers.cookie, REFRESH_COOKIE_NAME);
  const userId = refreshToken ? getRefreshTokenUserId(refreshToken) : undefined;

  if (!userId) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  const user = await getUserById(userId);
  if (!user) {
    throw new AppError(401, "UNAUTHENTICATED", "Authentication required");
  }

  res.json({
    accessToken: createAccessToken(user.user_id),
    user: toUserResponse(user),
  });
});

router.post("/logout", (_req, res) => {
  clearRefreshCookie(res);
  res.status(204).end();
});

export default router;
