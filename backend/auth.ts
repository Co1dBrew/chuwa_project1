import argon2 from "argon2";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "./error.js";
import { MAX_POSTGRES_INTEGER, requireEnv } from "./utils.js";

const JWT_SECRET = requireEnv("JWT_SECRET");

function unauthenticated(): AppError {
  return new AppError(401, "UNAUTHENTICATED", "Authentication required");
}

export function createAccessToken(userId: number) {
  return jwt.sign(
    {
      sub: String(userId),
    },
    JWT_SECRET,
    {
      expiresIn: "15m",
      issuer: "my-api",
      audience: "my-frontend",
    },
  );
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

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authorization = req.get("Authorization");

  if (!authorization?.startsWith("Bearer ")) throw unauthenticated();

  const token = authorization.slice("Bearer ".length);
  let payload: jwt.JwtPayload | string;

  try {
    payload = jwt.verify(token, JWT_SECRET, {
      issuer: "my-api",
      audience: "my-frontend",
    });
  } catch {
    throw unauthenticated();
  }

  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw unauthenticated();
  }

  const userId = Number(payload.sub);

  if (
    !Number.isSafeInteger(userId) ||
    userId < 1 ||
    userId > MAX_POSTGRES_INTEGER
  ) {
    throw unauthenticated();
  }

  req.auth = { userId };
  next();
}
