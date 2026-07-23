import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  User,
  UserRole,
} from "../types/user";
import { request } from "./httpClient";

interface ApiUser {
  user_id: number;
  username: string;
  email: string;
  nickname: string | null;
  role: UserRole;
  avatar_url: string | null;
}

function mapApiUser(apiUser: ApiUser): User {
  return {
    id: String(apiUser.user_id),
    username: apiUser.username,
    email: apiUser.email,
    role: apiUser.role,
  };
}

interface ApiAuthResult {
  accessToken: string;
  user: ApiUser;
}

function mapAuthResult(response: ApiAuthResult): AuthResult {
  return { user: mapApiUser(response.user), token: response.accessToken };
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  const response = await request<ApiAuthResult>(
    "/users/signin",
    {
      method: "POST",
      body: { username: input.username, password: input.password },
      skipAuthRecovery: true,
    },
  );

  return mapAuthResult(response);
}

export async function refreshSession(): Promise<AuthResult> {
  const response = await request<ApiAuthResult>(
    "/users/refresh",
    { method: "POST", skipAuthRecovery: true },
  );

  return mapAuthResult(response);
}

export async function signOut(): Promise<void> {
  await request<void>("/users/logout", {
    method: "POST",
    skipAuthRecovery: true,
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await request<void>("/users/me/password", {
    method: "PATCH",
    body: {
      current_password: currentPassword,
      new_password: newPassword,
    },
  });
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  await request<ApiUser>("/users/registration", {
    method: "POST",
    body: {
      username: input.username,
      email: input.email,
      password: input.password,
      role: input.role,
    },
    skipAuthRecovery: true,
  });

  return signIn({ username: input.username, password: input.password });
}
