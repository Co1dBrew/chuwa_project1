// Cart service: the shopping cart now lives on the backend (/cart-items), scoped
// to the signed-in user by their token. These functions match the backend's
// cart endpoints; the cart Redux slice calls them from its thunks.

import type { CartItem } from "../types/cart";
import type { ApiProduct } from "../types/product";
import { request } from "./httpClient";

// The backend returns the cart as { user_id, items: [{ item, quantity }] }.
interface ApiCartResponse {
  user_id: number;
  items: { item: ApiProduct; quantity: number }[];
}

// Turn a backend product + quantity into the app's CartItem shape.
function toCartItem(apiProduct: ApiProduct, quantity: number): CartItem {
  const meta = apiProduct.meta;
  const metaImageUrl = typeof meta.imageUrl === "string" ? meta.imageUrl : null;

  return {
    productId: String(apiProduct.product_id),
    name: apiProduct.name,
    imageUrl: apiProduct.image_url ?? metaImageUrl ?? "",
    priceCents: apiProduct.price_amount,
    quantity: quantity,
    stock: apiProduct.inventory,
  };
}

// Load the signed-in user's cart.
export async function getCart(): Promise<CartItem[]> {
  const response = await request<ApiCartResponse>("/cart-items");
  return response.items.map(function (row) {
    return toCartItem(row.item, row.quantity);
  });
}

// Add a product to the cart with the given quantity.
export async function addItem(
  productId: string,
  quantity: number,
): Promise<void> {
  await request<unknown>("/cart-items", {
    method: "POST",
    body: { product_id: Number(productId), quantity: quantity },
  });
}

// Increase one product's quantity by 1.
export async function incrementItem(productId: string): Promise<void> {
  await request<unknown>("/cart-items/" + productId + "/increment", {
    method: "POST",
  });
}

// Set an exact quantity for one product.
export async function setItemQuantity(
  productId: string,
  quantity: number,
): Promise<void> {
  await request<unknown>("/cart-items/" + productId, {
    method: "PATCH",
    body: { quantity: quantity },
  });
}

// Remove one product from the cart.
export async function removeItem(productId: string): Promise<void> {
  await request<void>("/cart-items/" + productId, { method: "DELETE" });
}

// Empty the whole cart (used at checkout). Deletes each item in turn.
export async function clearCart(): Promise<void> {
  const items = await getCart();
  for (const item of items) {
    await removeItem(item.productId);
  }
}
