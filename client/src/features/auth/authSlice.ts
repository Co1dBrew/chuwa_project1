// The authentication slice of the Redux store: the signed-in user, token,
// a loading flag and an error message.

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  User,
} from "../../types/user";
import * as authService from "../../services/authService";
import { loadFromStorage } from "../../utils/storage";

/** The key under which we save the logged-in user between page refreshes. */
export const AUTH_STORAGE_KEY = "pms.auth";

/** The shape of this slice's state. */
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/** The small piece of auth data we save to (and load from) localStorage. */
interface PersistedAuth {
  user: User | null;
  token: string | null;
}

/** Build the starting state, restoring the saved user from localStorage if any. */
function buildInitialState(): AuthState {
  const saved = loadFromStorage<PersistedAuth>(AUTH_STORAGE_KEY);

  return {
    user: saved !== null ? saved.user : null,
    token: saved !== null ? saved.token : null,
    loading: false,
    error: null,
  };
}

/** Sign in; on failure rejects with an error message for the UI. */
export const signInThunk = createAsyncThunk<
  AuthResult,
  SignInInput,
  { rejectValue: string }
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

const authSlice = createSlice({
  name: "auth",
  initialState: buildInitialState(),
  reducers: {
    /** Sign the user out and clear everything. */
    logout(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = null;
    },
    /** Clear any error message. */
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: function (builder) {
    builder
      // Sign in
      .addCase(signInThunk.pending, function (state) {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signInThunk.fulfilled,
        function (state, action: PayloadAction<AuthResult>) {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signInThunk.rejected, function (state, action) {
        state.loading = false;
        state.error = action.payload ?? "Sign in failed.";
      })

      // Sign up
      .addCase(signUpThunk.pending, function (state) {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signUpThunk.fulfilled,
        function (state, action: PayloadAction<AuthResult>) {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signUpThunk.rejected, function (state, action) {
        state.loading = false;
        state.error = action.payload ?? "Sign up failed.";
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
