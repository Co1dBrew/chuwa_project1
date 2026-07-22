// Mock product service backed by localStorage; mimics a real API.

import type {
  ApiProduct,
  Product,
  ProductInput,
  ProductPage,
  ProductQuery,
} from "../types/product";
import { MOCK_API_PRODUCTS } from "../mocks/products";
import { loadFromStorage, saveToStorage } from "../utils/storage";
import { isNonNegativeNumber } from "../utils/validation";
import { mapApiProductToProduct } from "../utils/productMapper";

// ".v2" suffix avoids clashing with older data using a different shape.
const STORAGE_KEY = "pms.products.v2";

const DEFAULT_PAGE_SIZE = 8;

// Fake the small delay of a network request.
function delay(milliseconds: number): Promise<void> {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

// Read all products from storage, seeding from the mock list on first run.
function readAllApiProducts(): ApiProduct[] {
  const saved = loadFromStorage<ApiProduct[]>(STORAGE_KEY);

  if (saved === null) {
    saveToStorage(STORAGE_KEY, MOCK_API_PRODUCTS);
    return MOCK_API_PRODUCTS;
  }

  return saved;
}

function writeAllApiProducts(products: ApiProduct[]): void {
  saveToStorage(STORAGE_KEY, products);
}

// Next id is the largest existing numeric id plus one.
function createNextId(products: ApiProduct[]): string {
  let maxId = 0;
  for (const product of products) {
    const numericId = Number(product.product_id);
    if (!Number.isNaN(numericId) && numericId > maxId) {
      maxId = numericId;
    }
  }
  return String(maxId + 1);
}

// Get a page of products, optionally filtered by search text and category.
export async function getProducts(query: ProductQuery = {}): Promise<ProductPage> {
  await delay(300);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  let apiProducts = readAllApiProducts();

  // Filter by search text (matches name or description).
  if (query.search !== undefined && query.search.trim() !== "") {
    const searchLower = query.search.trim().toLowerCase();
    apiProducts = apiProducts.filter(function (product) {
      const nameMatches = product.name.toLowerCase().includes(searchLower);
      const descriptionMatches = product.description
        .toLowerCase()
        .includes(searchLower);
      return nameMatches || descriptionMatches;
    });
  }

  // Filter by category (unless "All" / empty was requested).
  if (query.category !== undefined && query.category !== "") {
    apiProducts = apiProducts.filter(function (product) {
      return product.category === query.category;
    });
  }

  // Total is counted after filtering but before paginating.
  const total = apiProducts.length;

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageApiProducts = apiProducts.slice(startIndex, endIndex);

  const items = pageApiProducts.map(function (apiProduct) {
    return mapApiProductToProduct(apiProduct);
  });

  return {
    items: items,
    total: total,
    page: page,
    pageSize: pageSize,
  };
}

// Get a single product by its id; throws if not found.
export async function getProductById(id: string): Promise<Product> {
  await delay(300);

  const apiProducts = readAllApiProducts();
  const found = apiProducts.find(function (product) {
    return product.product_id === id;
  });

  if (found === undefined) {
    throw new Error("Product not found.");
  }

  return mapApiProductToProduct(found);
}

// Validate product data before saving; throws on invalid input.
function validateProductInput(
  input: ProductInput,
  allProducts: ApiProduct[],
  idBeingEdited: string | null,
): void {
  if (!isNonNegativeNumber(input.priceCents)) {
    throw new Error("Price cannot be negative.");
  }

  if (!isNonNegativeNumber(input.stock)) {
    throw new Error("Stock cannot be negative.");
  }

  // SKU must be unique across all other products.
  const skuAlreadyUsed = allProducts.some(function (product) {
    const isDifferentProduct = product.product_id !== idBeingEdited;
    const hasSameSku = product.sku.toLowerCase() === input.sku.toLowerCase();
    return isDifferentProduct && hasSameSku;
  });

  if (skuAlreadyUsed) {
    throw new Error("A product with this SKU already exists.");
  }
}

// Create a brand new product.
export async function createProduct(input: ProductInput): Promise<Product> {
  await delay(300);

  const apiProducts = readAllApiProducts();
  validateProductInput(input, apiProducts, null);

  const newApiProduct: ApiProduct = {
    product_id: createNextId(apiProducts),
    name: input.name,
    description: input.description,
    sku: input.sku,
    category: input.category,
    // Backend shape wants price as a string of cents.
    price_amount: String(input.priceCents),
    inventory: input.stock,
    image_url: input.imageUrl,
    meta: {
      // Defaults for fields the form does not collect yet.
      brand: "",
      specs: { model: "", warranty_months: 0 },
      rating: input.rating,
      category: input.category,
      featured: false,
    },
  };

  // Put the new product at the front of the list.
  const updatedProducts = [newApiProduct, ...apiProducts];
  writeAllApiProducts(updatedProducts);

  return mapApiProductToProduct(newApiProduct);
}

// Update an existing product, preserving fields the form does not manage.
export async function updateProduct(
  id: string,
  input: ProductInput,
): Promise<Product> {
  await delay(300);

  const apiProducts = readAllApiProducts();
  validateProductInput(input, apiProducts, id);

  const index = apiProducts.findIndex(function (product) {
    return product.product_id === id;
  });

  if (index === -1) {
    throw new Error("Product not found.");
  }

  const existing = apiProducts[index];

  const updatedApiProduct: ApiProduct = {
    ...existing,
    name: input.name,
    description: input.description,
    sku: input.sku,
    category: input.category,
    price_amount: String(input.priceCents),
    inventory: input.stock,
    image_url: input.imageUrl,
    meta: {
      ...existing.meta,
      rating: input.rating,
      category: input.category,
    },
  };

  const updatedProducts = apiProducts.slice();
  updatedProducts[index] = updatedApiProduct;
  writeAllApiProducts(updatedProducts);

  return mapApiProductToProduct(updatedApiProduct);
}

// Delete a product; throws if it does not exist.
export async function deleteProduct(id: string): Promise<void> {
  await delay(300);

  const apiProducts = readAllApiProducts();
  const exists = apiProducts.some(function (product) {
    return product.product_id === id;
  });

  if (!exists) {
    throw new Error("Product not found.");
  }

  const remainingProducts = apiProducts.filter(function (product) {
    return product.product_id !== id;
  });
  writeAllApiProducts(remainingProducts);
}

// Reduce stock for purchased products at checkout (never below 0).
export async function reduceStockForPurchase(
  purchases: { productId: string; quantity: number }[],
): Promise<void> {
  await delay(300);

  const apiProducts = readAllApiProducts();

  const updatedProducts = apiProducts.map(function (product) {
    const purchase = purchases.find(function (item) {
      return item.productId === product.product_id;
    });

    if (purchase === undefined) {
      return product;
    }

    let newInventory = product.inventory - purchase.quantity;
    if (newInventory < 0) {
      newInventory = 0;
    }

    return { ...product, inventory: newInventory };
  });

  writeAllApiProducts(updatedProducts);
}
