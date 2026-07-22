/*
 * The mock product service.
 *
 * This file pretends to be a backend server. Every function returns a Promise
 * and waits a short moment before answering, so the rest of the app can show
 * loading spinners and handle errors exactly the way it would with a real API.
 *
 * KEY DESIGN POINT (for switching to a real backend later):
 * Internally this service stores and works with data in the RAW backend shape
 * (the ApiProduct type: snake_case fields, price as a string of cents, a nested
 * meta object). Only at the very end, right before returning, does it convert
 * each ApiProduct into the clean Product shape using mapApiProductToProduct().
 *
 * A future real service will do the same thing: fetch ApiProduct objects over
 * HTTP, then map them with the exact same function. Because both services hand
 * the pages a Product, nothing in the UI has to change when we switch.
 *
 * The data lives in the browser's localStorage. The first time the app runs we
 * copy the MOCK_API_PRODUCTS list into storage; after that every change is
 * saved back so it survives a page refresh.
 */

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

/*
 * The key under which the product list is saved in localStorage.
 * The ".v2" suffix is used because the stored data shape changed to ApiProduct;
 * a fresh key avoids clashing with any older data a browser might still have.
 */
const STORAGE_KEY = "pms.products.v2";

/** How many products to show per page if the caller does not say. */
const DEFAULT_PAGE_SIZE = 8;

/**
 * Wait for a number of milliseconds, then continue.
 * This fakes the small delay a real network request would have.
 */
function delay(milliseconds: number): Promise<void> {
  return new Promise(function (resolve) {
    window.setTimeout(resolve, milliseconds);
  });
}

/**
 * Read the full product list (in raw backend shape) from storage. If nothing is
 * saved yet, seed the storage with the mock products and return those.
 */
function readAllApiProducts(): ApiProduct[] {
  const saved = loadFromStorage<ApiProduct[]>(STORAGE_KEY);

  if (saved === null) {
    // First run: copy the mock data into storage so future edits persist.
    saveToStorage(STORAGE_KEY, MOCK_API_PRODUCTS);
    return MOCK_API_PRODUCTS;
  }

  return saved;
}

/** Save the full product list (raw backend shape) back to storage. */
function writeAllApiProducts(products: ApiProduct[]): void {
  saveToStorage(STORAGE_KEY, products);
}

/**
 * Work out the next product id, mimicking how a database hands out new ids:
 * take the largest existing numeric id and add one.
 */
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

/**
 * Get a page of products, optionally filtered by search text and category.
 *
 * @param query Search text, category, page number and page size (all optional).
 * @returns The products for the requested page (as clean Product objects) plus
 *          the total count.
 */
export async function getProducts(query: ProductQuery = {}): Promise<ProductPage> {
  await delay(300);

  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  let apiProducts = readAllApiProducts();

  // Step 1: filter by the search text (matches name or description).
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

  // Step 2: filter by category (unless "All" / empty was requested).
  if (query.category !== undefined && query.category !== "") {
    apiProducts = apiProducts.filter(function (product) {
      return product.category === query.category;
    });
  }

  // The total count is measured AFTER filtering but BEFORE paginating,
  // because the pagination control needs to know how many matches there are.
  const total = apiProducts.length;

  // Step 3: cut out just the slice of products for the requested page.
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageApiProducts = apiProducts.slice(startIndex, endIndex);

  // Step 4: convert each raw product into the clean Product shape the app uses.
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

/**
 * Get a single product by its id.
 *
 * @param id The id of the product to find.
 * @returns The matching product (in the app's Product shape).
 * @throws An error if no product has that id.
 */
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

/**
 * Make sure the product data is valid before saving it.
 * Throws a clear error if something is wrong.
 */
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

  // The SKU must be unique. Look for any OTHER product that already uses it.
  const skuAlreadyUsed = allProducts.some(function (product) {
    const isDifferentProduct = product.product_id !== idBeingEdited;
    const hasSameSku = product.sku.toLowerCase() === input.sku.toLowerCase();
    return isDifferentProduct && hasSameSku;
  });

  if (skuAlreadyUsed) {
    throw new Error("A product with this SKU already exists.");
  }
}

/**
 * Create a brand new product.
 *
 * The form gives us a ProductInput (clean shape); here we build a full
 * ApiProduct (backend shape) to store, then map it back to a Product to return.
 *
 * @param input The new product's data (no id yet).
 * @returns The created product.
 * @throws An error if the data is invalid or the SKU is already taken.
 */
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
    // The app stores price as a number of cents; the backend shape wants a string.
    price_amount: String(input.priceCents),
    inventory: input.stock,
    image_url: input.imageUrl,
    meta: {
      // The form does not collect these extra fields yet, so we use sensible
      // defaults. A real backend may fill them in itself.
      brand: "",
      specs: { model: "", warranty_months: 0 },
      rating: input.rating,
      category: input.category,
      featured: false,
    },
  };

  // Put the new product at the FRONT of the list so it is easy to spot.
  const updatedProducts = [newApiProduct, ...apiProducts];
  writeAllApiProducts(updatedProducts);

  return mapApiProductToProduct(newApiProduct);
}

/**
 * Update an existing product.
 *
 * We spread the existing record first so that fields the form does not manage
 * (brand, specs, featured) are kept, then overwrite the fields it does manage.
 *
 * @param id The id of the product to update.
 * @param input The new data for the product.
 * @returns The updated product.
 * @throws An error if the product does not exist or the data is invalid.
 */
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

  // Make a copy of the list and replace the one item that changed.
  const updatedProducts = apiProducts.slice();
  updatedProducts[index] = updatedApiProduct;
  writeAllApiProducts(updatedProducts);

  return mapApiProductToProduct(updatedApiProduct);
}

/**
 * Delete a product.
 *
 * @param id The id of the product to delete.
 * @throws An error if the product does not exist.
 */
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

/**
 * Reduce the stock of the purchased products (called at checkout).
 *
 * For each item bought, subtract the quantity from that product's inventory
 * (never letting it drop below 0). When an item's inventory reaches 0 it will
 * automatically show as "Out of stock" on the product pages, because those
 * pages already treat stock <= 0 as out of stock.
 *
 * In a real backend this would be a "place order" request, and the server would
 * be the one to reduce the stock. Here we do it in the mock so the demo behaves
 * realistically.
 *
 * @param purchases The products and quantities that were bought.
 */
export async function reduceStockForPurchase(
  purchases: { productId: string; quantity: number }[],
): Promise<void> {
  await delay(300);

  const apiProducts = readAllApiProducts();

  const updatedProducts = apiProducts.map(function (product) {
    // Find out whether this product was part of the purchase.
    const purchase = purchases.find(function (item) {
      return item.productId === product.product_id;
    });

    // Not bought: leave it unchanged.
    if (purchase === undefined) {
      return product;
    }

    // Bought: subtract the quantity, but never go below 0.
    let newInventory = product.inventory - purchase.quantity;
    if (newInventory < 0) {
      newInventory = 0;
    }

    return { ...product, inventory: newInventory };
  });

  writeAllApiProducts(updatedProducts);
}
