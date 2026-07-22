/*
 * Selectors for the auth slice.
 *
 * A selector is a small function that reads one specific thing out of the whole
 * Redux state. Components use selectors (through the useAppSelector hook) so
 * they only re-render when the exact value they care about changes.
 *
 * Keeping selectors in one file means that if the shape of the state ever
 * changes, we only fix the reading logic here.
 */

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

/** The status of the current auth request (idle / loading / succeeded / failed). */
export function selectAuthStatus(state: RootState) {
  return state.auth.status;
}

/** The latest auth error message, or null if there is none. */
export function selectAuthError(state: RootState): string | null {
  return state.auth.error;
}
