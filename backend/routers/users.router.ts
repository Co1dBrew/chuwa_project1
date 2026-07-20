import { Router } from "express";
import { z } from "zod";
import { createUser, getUserById, getUserByUsername } from "../db.js";
import { createAccessToken, hashPassword, verifyPassword } from "../auth.js";

const router = Router();

const UserIdSchema = z.coerce.number().int().positive();

router.get("/:userId", async (req, res) => {
  try {
    const userId = UserIdSchema.parse(req.params.userId);
    const { password_hash, ...safeUser } = await getUserById(userId);

    res.json(safeUser);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch user",
    });
  }
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
  // avatar url is not provided during registration, it is set later separately
  const { password, ...safeUserInput } = UserInput.parse(req.body);
  const passwordHash = await hashPassword(password);
  const { password_hash, ...safeUser } = await createUser({
    ...safeUserInput,
    password_hash: passwordHash,
    avatar_url: undefined,
  });

  res.status(201).location(`/users/${safeUser.user_id}`).json(safeUser);
});

// TODO: support sign in using either email or username
const SignInInput = z.object({
  username,
  password,
});

router.post("/signin", async (req, res) => {
  const { username, password } = SignInInput.parse(req.body);

  const { password_hash, ...safeUser } = await getUserByUsername(username);

  const ok = await verifyPassword(password_hash, password);

  if (!ok) {
    return res.status(401).json({
      error: "Invalid username or password",
    });
  }

  const accessToken = createAccessToken(String(safeUser.user_id));

  res.json({
    message: "Login successful",
    accessToken: accessToken,
    user: safeUser,
  });
});

export default router;
