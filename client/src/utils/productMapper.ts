/*
 * Functions that convert product data between the different shapes the app uses.
 *
 * There are three shapes involved:
 *   1. Product          - how a product is stored (price in cents).
 *   2. ProductFormValues - what the create/edit form shows (price in dollars).
 *   3. CartItem         - a line in the shopping cart.
 *
 * Keeping the conversions here means the form and the cart never have to worry
 * about the cents/dollars difference themselves.
 */

import type { ApiProduct, Product, ProductInput } from "../types/product";
import type { CartItem } from "../types/cart";
import { centsToDollars, dollarsToCents } from "./currency";

/**
 * Turn one raw ApiProduct (the exact shape the backend/database returns) into
 * the clean Product shape the rest of the app uses.
 *
 * This is the single most important conversion for switching to a real backend:
 * both the mock service and a future real HTTP service call this same function,
 * so the pages and Redux never see the snake_case backend shape.
 *
 * The main jobs here are:
 *   - rename fields (product_id -> id, inventory -> stock, image_url -> imageUrl)
 *   - turn the price_amount STRING into a number of cents
 *   - pull the rating out of the nested "meta" object
 *
 * @param apiProduct A product exactly as the backend returns it.
 * @returns The product in the app's internal shape.
 */
export function mapApiProductToProduct(apiProduct: ApiProduct): Product {
  return {
    id: apiProduct.product_id,
    name: apiProduct.name,
    description: apiProduct.description,
    sku: apiProduct.sku,
    category: apiProduct.category,
    // price_amount is a string of cents, e.g. "1975". Number("1975") is 1975.
    priceCents: Number(apiProduct.price_amount),
    stock: apiProduct.inventory,
    imageUrl: apiProduct.image_url,
    rating: apiProduct.meta.rating,
  };
}

/**
 * The values shown in and collected by the product create/edit form.
 *
 * The important difference from a Product is that "price" here is in DOLLARS
 * (a friendly number for a person to type), not cents.
 */
export interface ProductFormValues {
  name: string;
  description: string;
  /** Price in dollars, for example 12.99. */
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  rating: number;
  sku: string;
}

/**
 * Turn a stored Product into the values used to fill in the edit form.
 * The main job is converting the price from cents to dollars.
 *
 * @param product The product being edited.
 * @returns The values ready to be shown in the form.
 */
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

/**
 * Turn the values collected from the form into the data the service needs to
 * create or update a product. The main job is converting the price from dollars
 * back into cents.
 *
 * @param values The values the user entered in the form.
 * @returns Product data ready to be saved.
 */
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

/**
 * Turn a Product into a fresh shopping cart line with a quantity of 1.
 *
 * @param product The product being added to the cart.
 * @returns A new cart item.
 */
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
