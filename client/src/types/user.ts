/*
 * Type definitions related to users and authentication.
 *
 * A "type" in TypeScript describes the shape of an object: which fields it has
 * and what kind of value each field holds. Types do not exist when the code
 * runs in the browser; they only help us (and the editor) catch mistakes while
 * we write the code.
 */

/**
 * The two kinds of user our system supports.
 *
 * A union type ("user" | "admin") means the value must be exactly one of these
 * two strings. This is how we tell a normal shopper apart from an administrator.
 */
export type UserRole = "user" | "admin";

/**
 * A user account as the rest of the application sees it.
 *
 * Notice there is no password field here on purpose: once a user is logged in
 * we never keep their password around in memory.
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
}

/**
 * The values collected by the Sign Up form.
 */
export interface SignUpInput {
  username: string;
  email: string;
  password: string;
}

/**
 * The values collected by the Sign In form.
 */
export interface SignInInput {
  email: string;
  password: string;
}

/**
 * The values collected by the Update Password form.
 */
export interface UpdatePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/**
 * What the authentication service gives back after a successful sign in
 * or sign up: the user account plus a login token.
 *
 * In a real application the token would be a value from the server that proves
 * the user is logged in. Here it is only a simple mock string.
 */
export interface AuthResult {
  user: User;
  token: string;
}
