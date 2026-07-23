import argon2 from "argon2";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getUserById, type UserRole } from "./db.js";
import { AppError } from "./error.js";
import { MAX_POSTGRES_INTEGER, requireEnv } from "./utils.js";

const JWT_SECRET = requireEnv("JWT_SECRET");
const REFRESH_JWT_SECRET = requireEnv("REFRESH_JWT_SECRET");

const JWT_ISSUER = "my-api";
const JWT_AUDIENCE = "my-frontend";

function unauthenticated(): AppError {
  return new AppError(401, "UNAUTHENTICATED", "Authentication required");
}

function createToken(
  userId: number,
  type: "access" | "refresh",
  secret: string,
  expiresIn: "15m" | "7d",
) {
  return jwt.sign(
    { sub: String(userId), token_type: type },
    secret,
    {
      expiresIn,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    },
  );
}

export function createAccessToken(userId: number) {
  return createToken(userId, "access", JWT_SECRET, "15m");
}

export function createRefreshToken(userId: number) {
  return createToken(userId, "refresh", REFRESH_JWT_SECRET, "7d");
}

/** Verifies a typed JWT; returns its user id or undefined when invalid. */
function getTokenUserId(
  token: string,
  secret: string,
  type: "access" | "refresh",
): number | undefined {
  let payload: jwt.JwtPayload | string;

  try {
    payload = jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
  } catch {
    return undefined;
  }

  if (
    typeof payload === "string" ||
    payload.token_type !== type ||
    typeof payload.sub !== "string"
  ) {
    return undefined;
  }

  const userId = Number(payload.sub);
  return Number.isSafeInteger(userId) && userId >= 1 && userId <= MAX_POSTGRES_INTEGER
    ? userId
    : undefined;
}

export function getRefreshTokenUserId(token: string) {
  return getTokenUserId(token, REFRESH_JWT_SECRET, "refresh");
}

export async function hashPassword(password: string) {
  return argon2.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  return argon2.verify(hash, password);
}

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
      };
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authorization = req.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) throw unauthenticated();

  const token = authorization.slice("Bearer ".length);
  const userId = getTokenUserId(token, JWT_SECRET, "access");
  if (!userId) throw unauthenticated();

  req.auth = { userId };
  next();
}

export function requireRole(role: UserRole) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.auth?.userId;

    if (!userId) throw unauthenticated();

    const user = await getUserById(userId);

    if (!user) throw unauthenticated();

    if (user.role !== role) {
      throw new AppError(403, "FORBIDDEN", "Insufficient permissions");
    }

    next();
  };
}
