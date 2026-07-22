// Conversions between the product shapes the app uses: Product (cents),
// ProductFormValues (dollars), and CartItem.

import type { ApiProduct, Product, ProductInput } from "../types/product";
import type { CartItem } from "../types/cart";
import { centsToDollars, dollarsToCents } from "./currency";

// Map a raw backend ApiProduct (snake_case) into the app's internal Product shape.
// Both the mock and future real HTTP services call this, so the rest of the app
// never sees the backend shape.
export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.product_id,
    name: apiProduct.name,
    description: apiProduct.description,
    sku: apiProduct.sku,
    category: apiProduct.category,
    // price_amount is a string of cents, e.g. "1975".
    priceCents: Number(apiProduct.price_amount),
    stock: apiProduct.inventory,
    imageUrl: apiProduct.image_url,
    rating: apiProduct.meta.rating,
  };
}

// Values shown in the product create/edit form. Unlike Product, price is in dollars.
export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  rating: number;
  sku: string;
}

// Convert a stored Product into edit-form values (price cents -> dollars).
export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    price: centsToDollars(product.priceCents),
    stock: product.stock,
    imageUrl: product.imageUrl,
    category: product.category,
    rating: product.rating,
    sku: product.sku,
  };
}

// Convert form values into the input the service needs (price dollars -> cents).
export function formValuesToProductInput(values: ProductFormValues): ProductInput {
  return {
    name: values.name,
    description: values.description,
    priceCents: dollarsToCents(values.price),
    stock: values.stock,
    imageUrl: values.imageUrl,
    category: values.category,
    rating: values.rating,
    sku: values.sku,
  };
}

// Turn a Product into a fresh cart line with quantity 1.
export function productToCartItem(product: Product): CartItem {
  return {
    productId: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    priceCents: product.priceCents,
    quantity: 1,
    stock: product.stock,
  };
}
