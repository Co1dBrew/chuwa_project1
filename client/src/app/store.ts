/*
 * The Redux store: the single place that holds all global application state.
 *
 * We combine two slices here:
 *   - auth : who is logged in
 *   - cart : what is in the shopping cart
 *
 * We also set up PERSISTENCE: every time the state changes we save the auth and
 * cart data to localStorage. Combined with the slices reading their starting
 * state back from localStorage, this is what keeps the user logged in and their
 * cart intact after a page refresh.
 */

import { configureStore } from "@reduxjs/toolkit";
import authReducer, { AUTH_STORAGE_KEY } from "../features/auth/authSlice";
import cartReducer, { saveCartForUser } from "../features/cart/cartSlice";
import { saveToStorage } from "../utils/storage";

// configureStore wires our slice reducers together into one store.
export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
  },
});

/*
 * store.subscribe registers a function that runs after EVERY state change.
 * Here we use it to copy the latest auth and cart data into localStorage.
 */
store.subscribe(function () {
  const state = store.getState();

  // For auth we only save the user and token, not the temporary status/error.
  saveToStorage(AUTH_STORAGE_KEY, {
    user: state.auth.user,
    token: state.auth.token,
  });

  // The cart is saved PER USER, under that user's id, so each person gets their
  // own cart back when they log in. Guests (nobody logged in) get no saved cart.
  if (state.auth.user !== null) {
    saveCartForUser(state.auth.user.id, state.cart);
  }
});

/*
 * These two types are derived automatically from the store, so they always
 * match its real shape. Components and selectors import them to stay type-safe.
 *
 * RootState  = the type of the entire state object.
 * AppDispatch = the type of the store's dispatch function.
 */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
