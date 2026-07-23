// Redux store combining the auth and cart slices, with persistence to localStorage.

import { configureStore } from "@reduxjs/toolkit";
import authReducer, { AUTH_STORAGE_KEY } from "../features/auth/authSlice";
import cartReducer from "../features/cart/cartSlice";
import { saveToStorage } from "../utils/storage";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

// Persist the auth (user + token) to localStorage after every state change so a
// refresh keeps the user signed in. The cart is stored on the backend now, so it
// is not persisted here.
store.subscribe(function () {
  const state = store.getState();

  // Save only user and token, not the temporary status/error.
  saveToStorage(AUTH_STORAGE_KEY, {
    user: state.auth.user,
    token: state.auth.token,
  });
});

// Types derived from the store so they always match its real shape.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
