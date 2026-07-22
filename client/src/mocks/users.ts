// Mock user accounts. Plain-text passwords are acceptable only for this demo.

import type { User } from "../types/user";

// A User plus the password the mock "database" needs to verify sign-in.
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
