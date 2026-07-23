// Authentication service: talks to the real backend API over HTTP.
// The backend uses username-based login and different role names, so this file
// translates between the frontend's shapes and the backend's.

import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  User,
  UserRole,
} from "../types/user";
import { request } from "./httpClient";

// The backend's role names differ from the frontend's.
type BackendRole = "customer" | "merchant";

function toBackendRole(role: UserRole): BackendRole {
  return role === "admin" ? "merchant" : "customer";
}

function toFrontendRole(role: BackendRole): UserRole {
  return role === "merchant" ? "admin" : "user";
}

// The user shape the backend returns.
interface ApiUser {
  user_id: number;
  username: string;
  email: string;
  nickname: string | null;
  role: BackendRole;
  avatar_url: string | null;
}

// Convert a backend user into the app's User shape.
function mapApiUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.user_id),
    username: apiUser.username,
    email: apiUser.email,
    role: toFrontendRole(apiUser.role),
  };
}

// Sign in with a username and password.
export async function signIn(input: SignInInput): Promise<AuthResult> {
  const response = await request<{ accessToken: string; user: ApiUser }>(
    "/users/signin",
    {
      method: "POST",
      body: { username: input.username, password: input.password },
    },
  );

  return {
    user: mapApiUser(response.user),
    token: response.accessToken,
  };
}

// Register a new account, then sign in to obtain a token.
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  await request<ApiUser>("/users/registration", {
    method: "POST",
    body: {
      username: input.username,
      email: input.email,
      password: input.password,
      role: toBackendRole(input.role),
    },
  });

  // Registration does not return a token, so sign in with the same credentials.
  return signIn({ username: input.username, password: input.password });
}
