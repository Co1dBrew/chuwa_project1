// Product service the app imports from. Swap the mock for a real API here.

import * as mockProductService from "./mockProductService";

export const getProducts = mockProductService.getProducts;
export const getProductById = mockProductService.getProductById;
export const createProduct = mockProductService.createProduct;
export const updateProduct = mockProductService.updateProduct;
export const deleteProduct = mockProductService.deleteProduct;
export const reduceStockForPurchase = mockProductService.reduceStockForPurchase;
