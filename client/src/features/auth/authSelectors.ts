// Selectors for the auth slice.

import type { RootState } from "../../app/store";

/** The user who is currently signed in, or null if nobody is. */
export function selectCurrentUser(state: RootState) {
  return state.auth.user;
}

/** true if someone is signed in. */
export function selectIsAuthenticated(state: RootState): boolean {
  return state.auth.user !== null;
}

/** true if the signed-in user is an administrator. */
export function selectIsAdmin(state: RootState): boolean {
  return state.auth.user !== null && state.auth.user.role === "admin";
}

/** True while an auth request (sign in / sign up) is in flight. */
export function selectAuthLoading(state: RootState): boolean {
  return state.auth.loading;
}

/** The latest auth error message, or null if there is none. */
export function selectAuthError(state: RootState): string | null {
  return state.auth.error;
}
