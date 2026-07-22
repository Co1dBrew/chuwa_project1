/*
 * Type definitions related to the shopping cart.
 */

/**
 * A single line in the shopping cart.
 *
 * We copy a few product fields (name, image, price, stock) into the cart item
 * instead of only storing the product id. This "snapshot" means the cart can be
 * displayed correctly even without re-fetching every product, and the price
 * shown is the price at the time the item was added.
 */
export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  /** Unit price in cents at the time the item was added to the cart. */
  priceCents: number;
  /** How many of this product the shopper wants to buy. */
  quantity: number;
  /** The stock available for this product, used to cap the quantity. */
  stock: number;
}

/**
 * The full shopping cart state that lives in the Redux store.
 */
export interface CartState {
  /** Every line currently in the cart. */
  items: CartItem[];
  /** The promotion code that has been successfully applied ("" if none). */
  promotionCode: string;
  /** The discount amount in cents produced by the applied promotion code. */
  discountCents: number;
  /** An error message shown when an invalid promotion code is entered. */
  promotionError: string | null;
}
