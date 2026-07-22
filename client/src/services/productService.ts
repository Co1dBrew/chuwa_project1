/*
 * The product service the rest of the application talks to.
 *
 * WHY THIS FILE EXISTS:
 * Every page and Redux slice imports product functions from HERE, never from
 * mockProductService directly. Today these functions simply forward to the mock
 * service. When a real backend is ready, we only change this one file to call
 * the real API instead. No page needs to be rewritten, because they all depend
 * on this stable "interface".
 *
 * HOW THE SWAP WILL WORK:
 * The mock service already stores its data in the real backend's shape
 * (ApiProduct) and converts it with mapApiProductToProduct() before returning.
 * A real service would do the same: fetch ApiProduct objects over HTTP and run
 * them through the SAME mapApiProductToProduct(). Because both return the app's
 * Product shape, switching is just changing the right-hand side of the lines
 * below to point at the real API service.
 *
 * For example, a future real service might look like:
 *   export async function getProducts(query) {
 *     const response = await fetch(BASE_URL + "/products?...");
 *     const apiProducts = await response.json();      // ApiProduct[]
 *     return { items: apiProducts.map(mapApiProductToProduct), total: ... };
 *   }
 */

import * as mockProductService from "./mockProductService";

// Re-export the mock functions under the names the app expects.
// To switch to a real backend later, replace the right-hand side of each line
// with a call to your real API service (which reuses mapApiProductToProduct).
export const getProducts = mockProductService.getProducts;
export const getProductById = mockProductService.getProductById;
export const createProduct = mockProductService.createProduct;
export const updateProduct = mockProductService.updateProduct;
export const deleteProduct = mockProductService.deleteProduct;
export const reduceStockForPurchase = mockProductService.reduceStockForPurchase;
