// The shopping cart slice. The cart items now live on the backend (/cart-items),
// so the actions that change the cart are async thunks that call the backend and
// then refresh the item list. The promotion code / discount is still computed on
// the client (the backend has no promotion concept).

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { CartItem, CartState } from "../../types/cart";
import type { Product } from "../../types/product";
import type { RootState } from "../../app/store";
import * as cartService from "../../services/cartService";
import { logout } from "../auth/authSlice";

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

/** Add up the price of every item in the cart (before any discount). */
function calculateSubtotalCents(items: CartItem[]): number {
  let subtotal = 0;
  for (const item of items) {
    subtotal = subtotal + item.priceCents * item.quantity;
  }
  return subtotal;
}

/** Recalculate the discount (from the applied code) and store it on the state. */
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

// --- Thunks: each one calls the backend, then returns the fresh cart items. ---

/** Load the signed-in user's cart from the backend. */
export const loadCartThunk = createAsyncThunk<CartItem[]>(
  "cart/load",
  async function () {
    return await cartService.getCart();
  },
);

/** Add a product to the cart (or increment it, up to the stock limit). */
export const addToCartThunk = createAsyncThunk<
  CartItem[],
  Product,
  { state: RootState; rejectValue: string }
>("cart/add", async function (product, thunkApi) {
  if (product.stock <= 0) {
    return thunkApi.rejectWithValue("This product is out of stock.");
  }

  const existing = thunkApi
    .getState()
    .cart.items.find(function (item) {
      return item.productId === product.id;
    });

  if (existing === undefined) {
    await cartService.addItem(product.id, 1);
  } else {
    if (existing.quantity >= product.stock) {
      return thunkApi.rejectWithValue(
        "No more stock available for " + product.name + ".",
      );
    }
    await cartService.incrementItem(product.id);
  }

  return await cartService.getCart();
});

/** Increase the quantity of one item by 1, up to the stock limit. */
export const increaseQuantity = createAsyncThunk<
  CartItem[],
  string,
  { state: RootState }
>("cart/increase", async function (productId, thunkApi) {
  const item = thunkApi.getState().cart.items.find(function (current) {
    return current.productId === productId;
  });

  if (item !== undefined && item.quantity < item.stock) {
    await cartService.incrementItem(productId);
  }

  return await cartService.getCart();
});

/** Decrease the quantity of one item by 1. Remove it if it would reach 0. */
export const decreaseQuantity = createAsyncThunk<
  CartItem[],
  string,
  { state: RootState }
>("cart/decrease", async function (productId, thunkApi) {
  const item = thunkApi.getState().cart.items.find(function (current) {
    return current.productId === productId;
  });

  if (item !== undefined) {
    if (item.quantity <= 1) {
      await cartService.removeItem(productId);
    } else {
      await cartService.setItemQuantity(productId, item.quantity - 1);
    }
  }

  return await cartService.getCart();
});

/** Set an exact quantity for one item, clamped between 1 and the stock. */
export const setQuantity = createAsyncThunk<
  CartItem[],
  { productId: string; quantity: number },
  { state: RootState }
>("cart/setQuantity", async function ({ productId, quantity }, thunkApi) {
  const item = thunkApi.getState().cart.items.find(function (current) {
    return current.productId === productId;
  });

  if (item !== undefined) {
    let safeQuantity = Math.floor(quantity);
    if (Number.isNaN(safeQuantity) || safeQuantity < 1) {
      safeQuantity = 1;
    }
    if (safeQuantity > item.stock) {
      safeQuantity = item.stock;
    }
    await cartService.setItemQuantity(productId, safeQuantity);
  }

  return await cartService.getCart();
});

/** Remove one item from the cart completely. */
export const removeFromCart = createAsyncThunk<CartItem[], string>(
  "cart/remove",
  async function (productId) {
    await cartService.removeItem(productId);
    return await cartService.getCart();
  },
);

/** Place the order: empty the cart. (Stock reduction is not wired up yet.) */
export const checkoutThunk = createAsyncThunk<CartItem[]>(
  "cart/checkout",
  async function () {
    await cartService.clearCart();
    return await cartService.getCart();
  },
);

const cartSlice = createSlice({
  name: "cart",
  initialState: createEmptyCart(),
  reducers: {
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
  },

  extraReducers: function (builder) {
    // Every cart thunk resolves with the fresh item list; store it and recalc.
    function applyItems(state: CartState, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      recalculateDiscount(state);
    }

    builder
      .addCase(loadCartThunk.fulfilled, applyItems)
      .addCase(addToCartThunk.fulfilled, applyItems)
      .addCase(increaseQuantity.fulfilled, applyItems)
      .addCase(decreaseQuantity.fulfilled, applyItems)
      .addCase(setQuantity.fulfilled, applyItems)
      .addCase(removeFromCart.fulfilled, applyItems)
      .addCase(checkoutThunk.fulfilled, applyItems)
      // On logout, empty the in-memory cart (the backend keeps the saved cart).
      .addCase(logout, function () {
        return createEmptyCart();
      });
  },
});

export const { applyPromotionCode, clearPromotion, clearPromotionError } =
  cartSlice.actions;

export default cartSlice.reducer;
