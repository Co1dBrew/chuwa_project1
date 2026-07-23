import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  AuthResult,
  SignInInput,
  SignUpInput,
  User,
} from "../../types/user";
import * as authService from "../../services/authService";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  initialized: false,
};

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

export const initializeAuthThunk = createAsyncThunk<AuthResult | null>(
  "auth/initialize",
  async function () {
    try {
      return await authService.refreshSession();
    } catch {
      return null;
    }
  },
);

export const logoutThunk = createAsyncThunk<void>("auth/logout", async function () {
  try {
    await authService.signOut();
  } catch {}
});

function clearAuthState(state: AuthState): void {
  state.user = null;
  state.token = null;
  state.loading = false;
  state.error = null;
  state.initialized = true;
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      clearAuthState(state);
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: function (builder) {
    builder
      .addCase(signInThunk.pending, function (state) {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signInThunk.fulfilled,
        function (state, action) {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signInThunk.rejected, function (state, action) {
        state.loading = false;
        state.error = action.payload ?? "Sign in failed.";
      })
      .addCase(signUpThunk.pending, function (state) {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        signUpThunk.fulfilled,
        function (state, action) {
          state.loading = false;
          state.user = action.payload.user;
          state.token = action.payload.token;
        },
      )
      .addCase(signUpThunk.rejected, function (state, action) {
        state.loading = false;
        state.error = action.payload ?? "Sign up failed.";
      })
      .addCase(initializeAuthThunk.fulfilled, function (state, action) {
        state.initialized = true;
        if (action.payload === null) {
          clearAuthState(state);
          return;
        }
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, function (state) {
        clearAuthState(state);
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;

export default authSlice.reducer;
