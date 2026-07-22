/*
 * The shopping cart "slice" of the Redux store.
 *
 * This slice owns everything about the cart: the list of items, the applied
 * promotion code, and the discount it produces. Because the cart is global
 * state, the header badge, the product pages and the cart page all read from
 * this ONE place and therefore always agree with each other.
 *
 * CARTS ARE SAVED PER USER.
 * We keep a single object in localStorage that maps a user id to that user's
 * cart, for example: { "u2": { items: [...], ... }, "u5": { ... } }.
 *   - When a user logs in, we load THEIR cart from this map (extraReducers).
 *   - When the cart changes, the store saves it back under their id (store.ts).
 *   - When a user logs out, we empty the in-memory cart so nothing shows, but
 *     their saved cart stays in storage for next time.
 * Guests (logged-out visitors) do not have a cart at all.
 *
 * Most cart changes here are synchronous, so we use plain reducers. The
 * load-on-login / clear-on-logout behaviour reacts to the auth actions, so it
 * lives in extraReducers.
 */

import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CartState } from "../../types/cart";
import type { Product } from "../../types/product";
import type { User } from "../../types/user";
import { productToCartItem } from "../../utils/productMapper";
import { loadFromStorage, saveToStorage } from "../../utils/storage";
import {
  AUTH_STORAGE_KEY,
  logout,
  signInThunk,
  signUpThunk,
} from "../auth/authSlice";

/** The key under which the "user id -> cart" map is saved in localStorage. */
const CARTS_STORAGE_KEY = "pms.carts";

/**
 * The promotion codes the store accepts.
 * - "percent" means a percentage off the subtotal (value is the percent).
 * - "fixed" means a fixed amount off in cents (value is the number of cents).
 */
const PROMOTIONS: Record<string, { type: "percent" | "fixed"; value: number }> = {
  SAVE10: { type: "percent", value: 10 }, // 10% off
  WELCOME5: { type: "fixed", value: 500 }, // $5.00 off
};

/* ------------------------------------------------------------------ */
/* Per-user cart storage helpers                                       */
/* ------------------------------------------------------------------ */

/** Build a brand-new, empty cart. */
function createEmptyCart(): CartState {
  return {
    items: [],
    promotionCode: "",
    discountCents: 0,
    promotionError: null,
  };
}

/** Read the whole "user id -> cart" map from storage (or {} if none saved). */
function readAllCarts(): Record<string, CartState> {
  const saved = loadFromStorage<Record<string, CartState>>(CARTS_STORAGE_KEY);
  return saved !== null ? saved : {};
}

/** Load one user's saved cart, or an empty cart if they have none saved. */
function loadCartForUser(userId: string): CartState {
  const allCarts = readAllCarts();
  const savedCart = allCarts[userId];

  if (savedCart === undefined) {
    return createEmptyCart();
  }

  // A promotion error is a temporary message; never restore a stale one.
  return { ...savedCart, promotionError: null };
}

/**
 * Save one user's cart back into the map. Exported so the store (store.ts) can
 * call it whenever the cart changes.
 */
export function saveCartForUser(userId: string, cart: CartState): void {
  const allCarts = readAllCarts();
  allCarts[userId] = cart;
  saveToStorage(CARTS_STORAGE_KEY, allCarts);
}

/**
 * Find out who is logged in by reading the saved auth data. This lets us load
 * that user's cart as the starting state after a page refresh.
 */
function findLoggedInUserId(): string | null {
  const savedAuth = loadFromStorage<{ user: User | null }>(AUTH_STORAGE_KEY);
  if (savedAuth !== null && savedAuth.user !== null) {
    return savedAuth.user.id;
  }
  return null;
}

/** Build the starting cart: the logged-in user's saved cart, or empty. */
function buildInitialState(): CartState {
  const userId = findLoggedInUserId();
  if (userId !== null) {
    return loadCartForUser(userId);
  }
  return createEmptyCart();
}

/* ------------------------------------------------------------------ */
/* Money helpers                                                       */
/* ------------------------------------------------------------------ */

/** Add up the price of every item in the cart (before any discount). */
function calculateSubtotalCents(items: CartItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal = subtotal + item.priceCents * item.quantity;
  }
  return subtotal;
}

/**
 * Recalculate the discount and store it on the state.
 *
 * We call this after ANY change that affects the total (adding items, changing
 * quantities, applying a code, etc.) so the discount is always correct for the
 * current cart. It is kept as its own helper so the logic lives in one place.
 */
function recalculateDiscount(state: CartState): void {
  // No code applied means no discount.
  if (state.promotionCode === "") {
    state.discountCents = 0;
    return;
  }

  const promotion = PROMOTIONS[state.promotionCode];
  if (promotion === undefined) {
    state.discountCents = 0;
    return;
  }

  const subtotal = calculateSubtotalCents(state.items);

  let discount = 0;
  if (promotion.type === "percent") {
    discount = Math.round((subtotal * promotion.value) / 100);
  } else {
    discount = promotion.value;
  }

  // The discount can never be larger than the subtotal itself.
  if (discount > subtotal) {
    discount = subtotal;
  }

  state.discountCents = discount;
}

/* ------------------------------------------------------------------ */
/* The slice                                                           */
/* ------------------------------------------------------------------ */

const cartSlice = createSlice({
  name: "cart",
  initialState: buildInitialState(),
  reducers: {
    /**
     * Add a product to the cart. If it is already there, add one more (but never
     * more than the available stock).
     */
    addToCart(state, action: PayloadAction<Product>) {
      const product = action.payload;

      // Cannot add a product that is out of stock.
      if (product.stock <= 0) {
        return;
      }

      const existingItem = state.items.find(function (item) {
        return item.productId === product.id;
      });

      if (existingItem === undefined) {
        // Not in the cart yet: add a new line with quantity 1.
        state.items.push(productToCartItem(product));
      } else {
        // Already in the cart. First refresh the stored stock limit from the
        // product we were just given, in case an admin changed the stock since
        // this line was added. Then add one more, up to that limit.
        existingItem.stock = product.stock;
        if (existingItem.quantity < existingItem.stock) {
          existingItem.quantity = existingItem.quantity + 1;
        }
      }

      recalculateDiscount(state);
    },

    /** Increase the quantity of one item by 1, up to the stock limit. */
    increaseQuantity(state, action: PayloadAction<string>) {
      const productId = action.payload;
      const item = state.items.find(function (current) {
        return current.productId === productId;
      });

      if (item !== undefined && item.quantity < item.stock) {
        item.quantity = item.quantity + 1;
      }

      recalculateDiscount(state);
    },

    /** Decrease the quantity of one item by 1. Remove it if it reaches 0. */
    decreaseQuantity(state, action: PayloadAction<string>) {
      const productId = action.payload;
      const item = state.items.find(function (current) {
        return current.productId === productId;
      });

      if (item !== undefined) {
        item.quantity = item.quantity - 1;

        if (item.quantity <= 0) {
          state.items = state.items.filter(function (current) {
            return current.productId !== productId;
          });
        }
      }

      recalculateDiscount(state);
    },

    /**
     * Set an exact quantity for one item (used when the user types a number).
     * The value is kept between 1 and the available stock.
     */
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(function (current) {
        return current.productId === productId;
      });

      if (item === undefined) {
        return;
      }

      let safeQuantity = quantity;

      // Guard against bad input such as text, empty, or numbers that are too low.
      if (Number.isNaN(safeQuantity) || safeQuantity < 1) {
        safeQuantity = 1;
      }

      // You cannot buy half a product, so round down to a whole number.
      safeQuantity = Math.floor(safeQuantity);

      // Never allow more than the stock.
      if (safeQuantity > item.stock) {
        safeQuantity = item.stock;
      }

      item.quantity = safeQuantity;
      recalculateDiscount(state);
    },

    /** Remove one item from the cart completely. */
    removeFromCart(state, action: PayloadAction<string>) {
      const productId = action.payload;
      state.items = state.items.filter(function (item) {
        return item.productId !== productId;
      });
      recalculateDiscount(state);
    },

    /**
     * Try to apply a promotion code. If it is valid we store it and recalculate
     * the discount; if it is not, we store an error message instead.
     */
    applyPromotionCode(state, action: PayloadAction<string>) {
      // Compare in upper case so "save10" and "SAVE10" both work.
      const code = action.payload.trim().toUpperCase();

      if (code === "") {
        state.promotionError = "Please enter a promotion code.";
        return;
      }

      const promotion = PROMOTIONS[code];
      if (promotion === undefined) {
        // Invalid code: clear any previous discount and show the error.
        state.promotionCode = "";
        state.discountCents = 0;
        state.promotionError = "That promotion code is not valid.";
        return;
      }

      // Valid code: store it, clear the error, and recalculate the discount.
      state.promotionCode = code;
      state.promotionError = null;
      recalculateDiscount(state);
    },

    /** Remove the applied promotion code. */
    clearPromotion(state) {
      state.promotionCode = "";
      state.discountCents = 0;
      state.promotionError = null;
    },

    /**
     * Clear only the promotion error message (not the applied code). The
     * promotion form calls this when it opens, so an old "invalid code" error
     * does not linger the next time the user visits the cart.
     */
    clearPromotionError(state) {
      state.promotionError = null;
    },

    /** Empty the whole cart (for example after checkout). */
    clearCart(state) {
      state.items = [];
      state.promotionCode = "";
      state.discountCents = 0;
      state.promotionError = null;
    },
  },

  /*
   * extraReducers react to actions from OTHER slices (here, the auth slice).
   * This is how the cart follows the logged-in user around.
   */
  extraReducers: function (builder) {
    // When a user signs in, replace the current (empty) cart with the cart they
    // had saved from before. (The first argument, the old state, is not used
    // because we are fully replacing it, so we name it "_state".)
    builder.addCase(signInThunk.fulfilled, function (_state, action) {
      return loadCartForUser(action.payload.user.id);
    });

    // Same when a brand-new account signs up (they simply start with an empty cart).
    builder.addCase(signUpThunk.fulfilled, function (_state, action) {
      return loadCartForUser(action.payload.user.id);
    });

    // When the user logs out, empty the in-memory cart so nothing shows while
    // logged out. Their saved cart stays in storage for next time.
    builder.addCase(logout, function () {
      return createEmptyCart();
    });
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  setQuantity,
  removeFromCart,
  applyPromotionCode,
  clearPromotion,
  clearPromotionError,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
