/*
 * Selectors for the cart slice.
 *
 * These read useful, ready-to-display values out of the cart state. Because
 * every component uses these same selectors, the header badge, product pages
 * and cart page always show numbers that agree with one another.
 */

import type { RootState } from "../../app/store";
import type { CartItem } from "../../types/cart";

/** Every line currently in the cart. */
export function selectCartItems(state: RootState): CartItem[] {
  return state.cart.items;
}

/**
 * The total number of individual units in the cart (used for the header badge).
 * Example: 2 headphones + 3 mugs => 5.
 */
export function selectCartItemCount(state: RootState): number {
  let count = 0;
  for (const item of state.cart.items) {
    count = count + item.quantity;
  }
  return count;
}

/**
 * How many of ONE specific product are in the cart.
 * Used on the product list and detail pages to show "In cart: 2".
 *
 * @param state The whole Redux state.
 * @param productId The product to look up.
 */
export function selectQuantityForProduct(state: RootState, productId: string): number {
  const item = state.cart.items.find(function (current) {
    return current.productId === productId;
  });

  return item !== undefined ? item.quantity : 0;
}

/** The price of all items added up, before any discount, in cents. */
export function selectSubtotalCents(state: RootState): number {
  let subtotal = 0;
  for (const item of state.cart.items) {
    subtotal = subtotal + item.priceCents * item.quantity;
  }
  return subtotal;
}

/** The discount produced by the applied promotion code, in cents. */
export function selectDiscountCents(state: RootState): number {
  return state.cart.discountCents;
}

/** The final amount to pay (subtotal minus discount), in cents. */
export function selectTotalCents(state: RootState): number {
  const subtotal = selectSubtotalCents(state);
  const total = subtotal - state.cart.discountCents;

  // Safety check: the total should never drop below zero.
  return total > 0 ? total : 0;
}

/** The promotion code that is currently applied ("" if none). */
export function selectPromotionCode(state: RootState): string {
  return state.cart.promotionCode;
}

/** The promotion error message, or null if there is none. */
export function selectPromotionError(state: RootState): string | null {
  return state.cart.promotionError;
}
