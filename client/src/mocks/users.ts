/*
 * Mock (fake) user accounts.
 *
 * Because we have no real backend, this array is our starting list of accounts.
 * The auth service copies it into localStorage the first time the app runs, and
 * new sign-ups are added to the copy in localStorage.
 *
 * SECURITY NOTE: storing a plain-text password like this is ONLY acceptable in a
 * mock/demo. A real application would never keep raw passwords; the server would
 * store a securely hashed version instead.
 */

import type { User } from "../types/user";

/**
 * A stored user account. This is a normal User plus the password, because the
 * mock "database" needs the password to check sign-in attempts.
 */
export interface StoredUser extends User {
  password: string;
}

export const MOCK_USERS: StoredUser[] = [
  {
    id: "u1",
    username: "Admin",
    email: "admin@shop.com",
    role: "admin",
    password: "admin123",
  },
  {
    id: "u2",
    username: "Shopper",
    email: "user@shop.com",
    role: "user",
    password: "user123",
  },
];
