import { Router } from "express";
import { z } from "zod";
import {
  createUser,
  getUserById,
  getUserByUsername,
  isUniqueViolation,
} from "../db.js";
import { createAccessToken, hashPassword, verifyPassword } from "../auth.js";
import { AppError } from "../error.js";
import { MAX_POSTGRES_INTEGER } from "../utils.js";
import { parse } from "../validation.js";

const router = Router();

const UserIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_POSTGRES_INTEGER);

router.get("/:userId", async (req, res) => {
  const userId = parse(UserIdSchema, req.params.userId);
  const user = await getUserById(userId);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const { password_hash, ...safeUser } = user;

  res.json(safeUser);
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
    "Username must be 3–20   characters using only English letters and numbers.",
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
  let user: Awaited<ReturnType<typeof createUser>>;

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

  const { password_hash: _passwordHash, ...safeUser } = user;

  res.status(201).location(`/users/${safeUser.user_id}`).json(safeUser);
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

  const { password_hash, ...safeUser } = user;

  const valid = await verifyPassword(password_hash, password);

  if (!valid) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid username or password",
    );
  }

  const accessToken = createAccessToken(safeUser.user_id);

  res.json({
    message: "Login successful",
    accessToken: accessToken,
    user: safeUser,
  });
});

export default router;
