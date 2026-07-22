// Shopping-cart type definitions.

/**
 * A single line in the shopping cart. A few product fields are snapshotted here
 * so the cart renders without re-fetching, and the price is fixed at add time.
 */
export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  /** Unit price in cents at the time the item was added to the cart. */
  priceCents: number;
  quantity: number;
  /** Stock available for this product, used to cap the quantity. */
  stock: number;
}

/** The full shopping cart state that lives in the Redux store. */
export interface CartState {
  items: CartItem[];
  /** The applied promotion code ("" if none). */
  promotionCode: string;
  /** Discount amount in cents produced by the applied promotion code. */
  discountCents: number;
  /** Error message shown when an invalid promotion code is entered. */
  promotionError: string | null;
}
