/*
 * The authentication "slice" of the Redux store.
 *
 * A slice is one section of the global state plus the functions that change it.
 * This slice owns everything about the logged-in user:
 *   - who is currently signed in (user)
 *   - their login token
 *   - the status of the current request (idle / loading / succeeded / failed)
 *   - any error message to show the user
 *
 * ASYNC THUNKS:
 * Signing in, signing up and updating the password all talk to the (mock)
 * server, which takes time. We use createAsyncThunk for these. Redux Toolkit
 * automatically gives each thunk three states we can react to:
 *   - pending   : the request has started (show a loading spinner)
 *   - fulfilled : the request succeeded (save the data)
 *   - rejected  : the request failed (show an error message)
 */

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  UpdatePasswordInput,
  User,
} from "../../types/user";
import type { RootState } from "../../app/store";
import * as authService from "../../services/authService";
import { loadFromStorage } from "../../utils/storage";

/** The key under which we save the logged-in user between page refreshes. */
export const AUTH_STORAGE_KEY = "pms.auth";

/** The shape of this slice's state. */
interface AuthState {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

/** The small piece of auth data we save to (and load from) localStorage. */
interface PersistedAuth {
  user: User | null;
  token: string | null;
}

/**
 * Build the starting state. If the user logged in during a previous visit, we
 * restore them from localStorage so a page refresh keeps them signed in.
 */
function buildInitialState(): AuthState {
  const saved = loadFromStorage<PersistedAuth>(AUTH_STORAGE_KEY);

  return {
    user: saved !== null ? saved.user : null,
    token: saved !== null ? saved.token : null,
    status: "idle",
    error: null,
  };
}

/* ------------------------------------------------------------------ */
/* Async thunks                                                        */
/* ------------------------------------------------------------------ */

/**
 * Sign in. On success it returns the user and token; on failure it returns a
 * rejected value containing the error message so the UI can display it.
 */
export const signInThunk = createAsyncThunk<
  AuthResult, // the type returned on success
  SignInInput, // the argument passed in
  { rejectValue: string } // the type returned on failure
>("auth/signIn", async function (input, thunkApi) {
  try {
    const result = await authService.signIn(input);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    return thunkApi.rejectWithValue(message);
  }
});

/** Register a new account and sign the new user in. */
export const signUpThunk = createAsyncThunk<
  AuthResult,
  SignUpInput,
  { rejectValue: string }
>("auth/signUp", async function (input, thunkApi) {
  try {
    const result = await authService.signUp(input);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign up failed.";
    return thunkApi.rejectWithValue(message);
  }
});

/** Change the signed-in user's password. */
export const updatePasswordThunk = createAsyncThunk<
  User,
  UpdatePasswordInput,
  { state: RootState; rejectValue: string }
>("auth/updatePassword", async function (input, thunkApi) {
  // Find out who is currently signed in by reading the store.
  const state = thunkApi.getState();
  const currentUser = state.auth.user;

  if (currentUser === null) {
    return thunkApi.rejectWithValue("You must be signed in to do that.");
  }

  try {
    const updatedUser = await authService.updatePassword(currentUser.email, input);
    return updatedUser;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update password.";
    return thunkApi.rejectWithValue(message);
  }
});

/* ------------------------------------------------------------------ */
/* The slice itself                                                    */
/* ------------------------------------------------------------------ */

const authSlice = createSlice({
  name: "auth",
  initialState: buildInitialState(),
  // "reducers" are the plain (non-async) ways to change this state.
  reducers: {
    /** Sign the user out and clear everything. */
    logout(state) {
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = null;
    },
    /** Clear any error message (for example when the user opens a form again). */
    clearAuthError(state) {
      state.error = null;
    },
  },
  // "extraReducers" react to the async thunks above.
  extraReducers: function (builder) {
    builder
      // ----- Sign in -----
      .addCase(signInThunk.pending, function (state) {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        signInThunk.fulfilled,
        function (state, action: PayloadAction<AuthResult>) {
          state.status = "succeeded";
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signInThunk.rejected, function (state, action) {
        state.status = "failed";
        state.error = action.payload ?? "Sign in failed.";
      })

      // ----- Sign up -----
      .addCase(signUpThunk.pending, function (state) {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        signUpThunk.fulfilled,
        function (state, action: PayloadAction<AuthResult>) {
          state.status = "succeeded";
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signUpThunk.rejected, function (state, action) {
        state.status = "failed";
        state.error = action.payload ?? "Sign up failed.";
      })

      // ----- Update password -----
      .addCase(updatePasswordThunk.pending, function (state) {
        state.status = "loading";
        state.error = null;
      })
      .addCase(
        updatePasswordThunk.fulfilled,
        function (state, action: PayloadAction<User>) {
          state.status = "succeeded";
          // The user's basic info might have changed; keep it in sync.
          state.user = action.payload;
        },
      )
      .addCase(updatePasswordThunk.rejected, function (state, action) {
        state.status = "failed";
        state.error = action.payload ?? "Could not update password.";
      });
  },
});

// Export the plain action creators so components can dispatch them.
export const { logout, clearAuthError } = authSlice.actions;

// Export the reducer so the store can use it.
export default authSlice.reducer;
