// Product service: talks to the real backend API over HTTP.
// Pages import from here; the function signatures match what they already used,
// so the pages did not change when we swapped the mock for the real backend.

import type {
  ApiProduct,
  Product,
  ProductInput,
  ProductPage,
  ProductQuery,
} from "../types/product";
import { request } from "./httpClient";
import { mapApiProductToProduct } from "../utils/productMapper";
import {
  getCategoryIdByName,
  getCategoryNameById,
} from "./categoryService";

// The backend wraps the product list in this envelope.
interface ApiProductPage {
  items: ApiProduct[];
  total: number;
  page: number;
  pageSize: number;
}

// Find the backend category id for a category name, or fail with a clear error.
async function resolveCategoryId(categoryName: string): Promise<number> {
  const categoryId = await getCategoryIdByName(categoryName);
  if (categoryId === undefined) {
    throw new Error("That category does not exist.");
  }
  return categoryId;
}

// Get a page of products, optionally filtered by search text and category.
export async function getProducts(query: ProductQuery = {}): Promise<ProductPage> {
  const nameById = await getCategoryNameById();

  // Assemble the query string (search / category_id / page / pageSize).
  const params = new URLSearchParams();

  if (query.search !== undefined && query.search.trim() !== "") {
    params.set("search", query.search.trim());
  }

  if (query.category !== undefined && query.category !== "") {
    const categoryId = await getCategoryIdByName(query.category);
    if (categoryId !== undefined) {
      params.set("category_id", String(categoryId));
    }
  }

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }
  if (query.pageSize !== undefined) {
    params.set("pageSize", String(query.pageSize));
  }

  const queryString = params.toString();
  const path = "/products" + (queryString !== "" ? "?" + queryString : "");

  const response = await request<ApiProductPage>(path);

  return {
    items: response.items.map(function (apiProduct) {
      return mapApiProductToProduct(apiProduct, nameById);
    }),
    total: response.total,
    page: response.page,
    pageSize: response.pageSize,
  };
}

// Get a single product by its id; throws if not found.
export async function getProductById(id: string): Promise<Product> {
  const nameById = await getCategoryNameById();
  const apiProduct = await request<ApiProduct>("/products/" + id);
  return mapApiProductToProduct(apiProduct, nameById);
}

// Create a brand new product (merchant only). The photo is uploaded in the
// same multipart request, so the body is FormData rather than JSON. Numbers and
// the "meta" object are sent as strings, which the backend parses.
export async function createProduct(input: ProductInput): Promise<Product> {
  const nameById = await getCategoryNameById();
  const categoryId = await resolveCategoryId(input.category);

  const formData = new FormData();
  formData.append("name", input.name);
  if (input.description) {
    formData.append("description", input.description);
  }
  formData.append("sku", input.sku);
  formData.append("category_id", String(categoryId));
  formData.append("price_amount", String(input.priceCents));
  formData.append("inventory", String(input.stock));
  if (input.imageFile) {
    formData.append("image", input.imageFile);
  }

  const apiProduct = await request<ApiProduct>("/products", {
    method: "POST",
    body: formData,
  });

  return mapApiProductToProduct(apiProduct, nameById);
}

// Update an existing product (merchant only, and only your own products).
// The text fields are updated via PATCH (JSON); if a new photo was chosen, it is
// uploaded afterwards to the dedicated image endpoint.
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  const nameById = await getCategoryNameById();
  const categoryId = await resolveCategoryId(input.category);

  let apiProduct = await request<ApiProduct>("/products/" + id, {
    method: "PATCH",
    body: {
      name: input.name,
      description: input.description,
      sku: input.sku,
      category_id: categoryId,
      price_amount: input.priceCents,
      inventory: input.stock,
    },
  });

  // Only replace the photo if the user picked a new one.
  if (input.imageFile) {
    const formData = new FormData();
    formData.append("image", input.imageFile);
    apiProduct = await request<ApiProduct>("/products/" + id + "/image", {
      method: "POST",
      body: formData,
    });
  }

  return mapApiProductToProduct(apiProduct, nameById);
}

// Delete a product (merchant only, and only your own products).
export async function deleteProduct(id: string): Promise<void> {
  await request<void>("/products/" + id, { method: "DELETE" });
}
