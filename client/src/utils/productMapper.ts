// Conversions between the product shapes the app uses: Product (cents),
// ProductFormValues (dollars), and CartItem.

import type { ApiProduct, Product, ProductInput } from "../types/product";
import type { CartItem } from "../types/cart";
import { centsToDollars, dollarsToCents } from "./currency";

// Map a raw backend ApiProduct (snake_case) into the app's internal Product shape.
// The product service calls this on every response so the rest of the app never
// sees the backend shape. The backend stores the category as a numeric id, so we
// pass in a "category id -> name" lookup to fill in the readable category name.
export function mapApiProductToProduct(
  apiProduct: ApiProduct,
  categoryNameById: Record<number, string>,
): Product {
  const meta = apiProduct.meta;

  // We keep the app's rating and image URL inside the backend's free-form "meta".
  const rating = Number(meta.rating ?? 0);
  const metaImageUrl = typeof meta.imageUrl === "string" ? meta.imageUrl : null;

  return {
    id: String(apiProduct.product_id),
    name: apiProduct.name,
    description: apiProduct.description ?? "",
    sku: apiProduct.sku,
    category: categoryNameById[apiProduct.category_id] ?? "",
    // price_amount is already whole cents (a number).
    priceCents: apiProduct.price_amount,
    stock: apiProduct.inventory,
    // Prefer a real uploaded image, then a URL from older data, else empty.
    imageUrl: apiProduct.image_url ?? metaImageUrl ?? "",
    rating: Number.isNaN(rating) ? 0 : rating,
  };
}

// Values shown in the product create/edit form. Unlike Product, price is in
// dollars and the photo is a File to upload (null when none is chosen).
export interface ProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageFile: File | null;
  category: string;
  sku: string;
}

// Convert a stored Product into edit-form values (price cents -> dollars).
// The photo is not prefilled (you cannot put an existing image back into a file
// picker); the edit page shows the current photo separately instead.
export function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    price: centsToDollars(product.priceCents),
    stock: product.stock,
    imageFile: null,
    category: product.category,
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
    imageFile: values.imageFile,
    category: values.category,
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
