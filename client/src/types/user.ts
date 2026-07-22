// User and authentication type definitions.

/** The two kinds of user our system supports. */
export type UserRole = "user" | "admin";

/** A user account as the rest of the application sees it (no password field). */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

/** The values collected by the Sign Up form. */
export interface SignUpInput {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

/** The values collected by the Sign In form. */
export interface SignInInput {
  email: string;
  password: string;
}

/** The values collected by the Update Password form. */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** The user account plus login token returned after sign in or sign up. */
export interface AuthResult {
  user: User;
  token: string;
}
