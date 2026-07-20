import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { requireEnv } from "./utils.js";

const JWT_SECRET = requireEnv("JWT_SECRET");

export function createAccessToken(userId: string) {
  return jwt.sign(
    {
      sub: userId,
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
