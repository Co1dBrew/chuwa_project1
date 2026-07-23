// Product-related type definitions.

/** A single product in the store. */
export interface Product {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  /** Price in whole cents. Example: 1299 means $12.99. */
  priceCents: number;
  stock: number;
  imageUrl: string;
  category: string;
  rating: number;
  /** Stock Keeping Unit: a unique code that identifies the product. */
  sku: string;
}

// ApiProduct: the raw shape returned by the backend API. Differs from Product:
// snake_case fields, IDs and price are numbers, price_amount is in cents,
// "inventory" means stock, the category is a numeric "category_id" (its name is
// looked up separately), and rating/imageUrl (if any) live inside "meta".
// Convert to the app's Product with mapApiProductToProduct().

/** One product exactly as the backend API returns it. */
export interface ApiProduct {
  product_id: number;
  merchant_id: number;
  name: string;
  description: string | null;
  sku: string;
  /** Foreign key into the categories table; resolve to a name via GET /categories. */
  category_id: number;
  /** Price in whole cents. Example: 1975 means $19.75. */
  price_amount: number;
  /** Units in stock. The rest of the app calls this "stock". */
  inventory: number;
  /** A public image URL, or null if the product has no image. */
  image_url: string | null;
  /** Free-form JSON. We keep the app's rating and image URL here. */
  meta: Record<string, unknown>;
}

/** A product category as returned by GET /categories. */
export interface Category {
  id: string;
  name: string;
}

/** Data needed to create or update a product (a Product without its id). */
export interface ProductInput {
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  /** A newly chosen photo file to upload, or null to keep the existing one. */
  imageFile: File | null;
  category: string;
  sku: string;
}

/** Options for requesting a list of products; every field is optional. */
export interface ProductQuery {
  /** Matches product name or description. */
  search?: string;
  category?: string;
  /** Which page of results to return (starting at 1). */
  page?: number;
  pageSize?: number;
}

/** A paged list of products: the current page's items plus the total count. */
export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
}
