// The shopping cart slice of the Redux store. Carts are saved per user in
// localStorage under a "user id -> cart" map; guests have no cart.

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

/** The promotion codes the store accepts (percent off, or fixed cents off). */
const PROMOTIONS: Record<string, { type: "percent" | "fixed"; value: number }> = {
  SAVE10: { type: "percent", value: 10 }, // 10% off
  WELCOME5: { type: "fixed", value: 500 }, // $5.00 off
};

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

/** Save one user's cart back into the map (called by the store on cart changes). */
export function saveCartForUser(userId: string, cart: CartState): void {
  const allCarts = readAllCarts();
  allCarts[userId] = cart;
  saveToStorage(CARTS_STORAGE_KEY, allCarts);
}

/** Read the logged-in user's id from saved auth data, or null. */
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

/** Add up the price of every item in the cart (before any discount). */
function calculateSubtotalCents(items: CartItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal = subtotal + item.priceCents * item.quantity;
  }
  return subtotal;
}

/** Recalculate the discount and store it on the state. */
function recalculateDiscount(state: CartState): void {
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

const cartSlice = createSlice({
  name: "cart",
  initialState: buildInitialState(),
  reducers: {
    /** Add a product to the cart, or increment it up to the stock limit. */
    addToCart(state, action: PayloadAction<Product>) {
      const product = action.payload;

      if (product.stock <= 0) {
        return;
      }

      const existingItem = state.items.find(function (item) {
        return item.productId === product.id;
      });

      if (existingItem === undefined) {
        state.items.push(productToCartItem(product));
      } else {
        // Refresh the stock limit (an admin may have changed it), then add one more.
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

    /** Set an exact quantity for one item, clamped between 1 and the stock. */
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const { productId, quantity } = action.payload;
      const item = state.items.find(function (current) {
        return current.productId === productId;
      });

      if (item === undefined) {
        return;
      }

      let safeQuantity = quantity;

      if (Number.isNaN(safeQuantity) || safeQuantity < 1) {
        safeQuantity = 1;
      }

      // Round down; you cannot buy a fraction of a product.
      safeQuantity = Math.floor(safeQuantity);

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

    /** Apply a promotion code, or store an error message if it is invalid. */
    applyPromotionCode(state, action: PayloadAction<string>) {
      // Upper-case so "save10" and "SAVE10" both match.
      const code = action.payload.trim().toUpperCase();

      if (code === "") {
        state.promotionError = "Please enter a promotion code.";
        return;
      }

      const promotion = PROMOTIONS[code];
      if (promotion === undefined) {
        state.promotionCode = "";
        state.discountCents = 0;
        state.promotionError = "That promotion code is not valid.";
        return;
      }

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

    /** Clear only the promotion error message, not the applied code. */
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

  // React to auth actions so the cart follows the logged-in user.
  extraReducers: function (builder) {
    // On sign in, load that user's saved cart.
    builder.addCase(signInThunk.fulfilled, function (_state, action) {
      return loadCartForUser(action.payload.user.id);
    });

    // On sign up, start with the new user's (empty) cart.
    builder.addCase(signUpThunk.fulfilled, function (_state, action) {
      return loadCartForUser(action.payload.user.id);
    });

    // On logout, empty the in-memory cart; the saved cart stays in storage.
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
