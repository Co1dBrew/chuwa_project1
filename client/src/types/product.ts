// Product-related type definitions.

/** A single product in the store. */
export interface Product {
  id: string;
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
// snake_case fields, price_amount is a string of cents, "inventory" means
// stock, and rating lives inside "meta". Convert with mapApiProductToProduct().

/** The nested "meta" object inside an ApiProduct. */
export interface ApiProductMeta {
  brand: string;
  specs: {
    model: string;
    warranty_months: number;
  };
  rating: number;
  category: string;
  featured: boolean;
}

/** One product exactly as the backend database returns it. */
export interface ApiProduct {
  product_id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  /** Price in cents, stored as a STRING. Example: "1975" means $19.75. */
  price_amount: string;
  /** Units in stock. The rest of the app calls this "stock". */
  inventory: number;
  image_url: string;
  meta: ApiProductMeta;
}

/** Data needed to create or update a product (a Product without its id). */
export interface ProductInput {
  name: string;
  description: string;
  priceCents: number;
  stock: number;
  imageUrl: string;
  category: string;
  rating: number;
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
