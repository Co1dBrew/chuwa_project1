// Mock authentication service backed by localStorage; mimics a real API.

import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
  User,
} from "../types/user";
import { MOCK_USERS, type StoredUser } from "../mocks/users";
import { loadFromStorage, saveToStorage } from "../utils/storage";

const STORAGE_KEY = "pms.users";

// Fake the small delay of a network request.
function delay(milliseconds: number): Promise<void> {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

// Read all stored users, seeding from the mock list on first run.
function readAllUsers(): StoredUser[] {
  const savedUsers = loadFromStorage<StoredUser[]>(STORAGE_KEY);

  if (savedUsers === null) {
    saveToStorage(STORAGE_KEY, MOCK_USERS);
    return MOCK_USERS;
  }

  return savedUsers;
}

function writeAllUsers(users: StoredUser[]): void {
  saveToStorage(STORAGE_KEY, users);
}

// Convert a stored user into the public User object (no password).
function toPublicUser(storedUser: StoredUser): User {
  return {
    id: storedUser.id,
    username: storedUser.username,
    email: storedUser.email,
    role: storedUser.role,
  };
}

// Create a fake login token (a real app gets this from the server).
function createToken(user: User): string {
  return "mock-token-" + user.id + "-" + Date.now();
}

function createId(): string {
  return crypto.randomUUID();
}

// Sign in with an email and password.
export async function signIn(input: SignInInput): Promise<AuthResult> {
  await delay(400);

  const users = readAllUsers();
  const emailLower = input.email.trim().toLowerCase();

  const matchingUser = users.find(function (user) {
    return user.email.toLowerCase() === emailLower;
  });

  // Same message for unknown email or wrong password (avoids leaking which).
  if (matchingUser === undefined || matchingUser.password !== input.password) {
    throw new Error("Invalid email or password.");
  }

  const publicUser = toPublicUser(matchingUser);
  return {
    user: publicUser,
    token: createToken(publicUser),
  };
}

// Register a new account; always gets the "user" role.
export async function signUp(input: SignUpInput): Promise<AuthResult> {
  await delay(400);

  const users = readAllUsers();
  const emailLower = input.email.trim().toLowerCase();

  const emailAlreadyUsed = users.some(function (user) {
    return user.email.toLowerCase() === emailLower;
  });

  if (emailAlreadyUsed) {
    throw new Error("An account with this email already exists.");
  }

  const newStoredUser: StoredUser = {
    id: createId(),
    username: input.username,
    email: input.email,
    role: input.role,
    password: input.password,
  };

  const updatedUsers = [...users, newStoredUser];
  writeAllUsers(updatedUsers);

  const publicUser = toPublicUser(newStoredUser);
  return {
    user: publicUser,
    token: createToken(publicUser),
  };
}

// Change the password of the currently signed-in user.
export async function updatePassword(
  email: string,
  input: UpdatePasswordInput,
): Promise<User> {
  await delay(400);

  const users = readAllUsers();
  const emailLower = email.trim().toLowerCase();

  const index = users.findIndex(function (user) {
    return user.email.toLowerCase() === emailLower;
  });

  if (index === -1) {
    throw new Error("User not found.");
  }

  const user = users[index];

  if (user.password !== input.currentPassword) {
    throw new Error("Your current password is incorrect.");
  }

  if (input.newPassword === input.currentPassword) {
    throw new Error("The new password must be different from the current one.");
  }

  const updatedUser: StoredUser = { ...user, password: input.newPassword };
  const updatedUsers = users.slice();
  updatedUsers[index] = updatedUser;
  writeAllUsers(updatedUsers);

  return toPublicUser(updatedUser);
}
