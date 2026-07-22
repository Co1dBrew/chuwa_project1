/*
 * The mock authentication service.
 *
 * Like the product service, this pretends to be a backend server: every
 * function returns a Promise, waits a moment, and either resolves with data or
 * rejects by throwing an Error with a clear message.
 *
 * User accounts are stored in localStorage, seeded from the MOCK_USERS list on
 * first run. New sign-ups are added there so they survive a refresh.
 */

import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
  User,
} from "../types/user";
import { MOCK_USERS, type StoredUser } from "../mocks/users";
import { loadFromStorage, saveToStorage } from "../utils/storage";

/** The key under which the user list is saved in localStorage. */
const STORAGE_KEY = "pms.users";

/** Wait a number of milliseconds to imitate a network request. */
function delay(milliseconds: number): Promise<void> {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

/** Read all stored users, seeding from the mock list on first run. */
function readAllUsers(): StoredUser[] {
  const savedUsers = loadFromStorage<StoredUser[]>(STORAGE_KEY);

  if (savedUsers === null) {
    saveToStorage(STORAGE_KEY, MOCK_USERS);
    return MOCK_USERS;
  }

  return savedUsers;
}

/** Save all users back to storage. */
function writeAllUsers(users: StoredUser[]): void {
  saveToStorage(STORAGE_KEY, users);
}

/**
 * Turn a stored user (which includes the password) into the public User object
 * (which never includes the password).
 */
function toPublicUser(storedUser: StoredUser): User {
  return {
    id: storedUser.id,
    username: storedUser.username,
    email: storedUser.email,
    role: storedUser.role,
  };
}

/**
 * Create a fake login token. In a real app this comes from the server and
 * proves the user is signed in; here it is just a unique-looking string.
 */
function createToken(user: User): string {
  return "mock-token-" + user.id + "-" + Date.now();
}

/** Make a new unique id for a newly registered user. */
function createId(): string {
  return crypto.randomUUID();
}

/**
 * Sign in with an email and password.
 *
 * @param input The email and password the user typed.
 * @returns The public user and a login token.
 * @throws An error if the email is unknown or the password is wrong.
 */
export async function signIn(input: SignInInput): Promise<AuthResult> {
  await delay(400);

  const users = readAllUsers();
  const emailLower = input.email.trim().toLowerCase();

  const matchingUser = users.find(function (user) {
    return user.email.toLowerCase() === emailLower;
  });

  // For security we give the SAME message whether the email is unknown or the
  // password is wrong, so an attacker cannot tell which part was correct.
  if (matchingUser === undefined || matchingUser.password !== input.password) {
    throw new Error("Invalid email or password.");
  }

  const publicUser = toPublicUser(matchingUser);
  return {
    user: publicUser,
    token: createToken(publicUser),
  };
}

/**
 * Register a brand new account. New accounts always get the "user" role.
 *
 * @param input The username, email and password for the new account.
 * @returns The public user and a login token.
 * @throws An error if the email is already registered.
 */
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
    role: "user",
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

/**
 * Change the password of the currently signed-in user.
 *
 * @param email The email of the signed-in user.
 * @param input The current password and the desired new password.
 * @returns The public user (unchanged fields; password is not returned).
 * @throws An error if the current password is wrong or the new one is invalid.
 */
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

  // Make a copy of the list and update the one user whose password changed.
  const updatedUser: StoredUser = { ...user, password: input.newPassword };
  const updatedUsers = users.slice();
  updatedUsers[index] = updatedUser;
  writeAllUsers(updatedUsers);

  return toPublicUser(updatedUser);
}
