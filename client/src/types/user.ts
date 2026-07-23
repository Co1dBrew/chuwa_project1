// User and authentication type definitions.

export type UserRole = "customer" | "merchant";

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

/** The values collected by the Sign In form. The backend logs in by username. */
export interface SignInInput {
  username: string;
  password: string;
}

/** The user account plus login token returned after sign in or sign up. */
export interface AuthResult {
  user: User;
  token: string;
}
