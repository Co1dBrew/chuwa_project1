/*
 * Mock (fake) product data.
 *
 * IMPORTANT: this data is written in the EXACT shape the backend database
 * returns (the ApiProduct type). That is on purpose: when a real backend is
 * added later, the mock service can be replaced with real HTTP calls and the
 * data flowing through the app keeps the same structure, so nothing else needs
 * to change.
 *
 * Reminders about the backend shape:
 *   - price_amount is a STRING holding cents ("1975" means $19.75).
 *   - "inventory" is the stock count.
 *   - rating lives inside "meta".
 *
 * The image_url values here point at a free placeholder image service so the
 * pictures load during the mock demo. The real backend will return its own
 * image URLs instead.
 */

import type { ApiProduct } from "../types/product";

export const MOCK_API_PRODUCTS: ApiProduct[] = [
  {
    product_id: "1",
    name: "Portable Tire Inflator",
    description:
      "Portable Tire Inflator by RoadPro. A quality product from the automotive collection.",
    sku: "PRD-0001",
    category: "automotive",
    price_amount: "1975",
    inventory: 42,
    image_url: "https://picsum.photos/seed/PRD-0001/400/300",
    meta: {
      brand: "RoadPro",
      specs: { model: "AUT-1", warranty_months: 24 },
      rating: 3.6,
      category: "automotive",
      featured: true,
    },
  },
  {
    product_id: "2",
    name: "Car Phone Mount",
    description:
      "Car Phone Mount by RoadPro. A quality product from the automotive collection.",
    sku: "PRD-0002",
    category: "automotive",
    price_amount: "2250",
    inventory: 59,
    image_url: "https://picsum.photos/seed/PRD-0002/400/300",
    meta: {
      brand: "RoadPro",
      specs: { model: "AUT-2", warranty_months: 24 },
      rating: 3.7,
      category: "automotive",
      featured: true,
    },
  },
  {
    product_id: "3",
    name: "Wireless Headphones",
    description:
      "Over-ear Bluetooth headphones with active noise cancellation.",
    sku: "PRD-0003",
    category: "electronics",
    price_amount: "12999",
    inventory: 25,
    image_url: "https://picsum.photos/seed/PRD-0003/400/300",
    meta: {
      brand: "TechCore",
      specs: { model: "ELEC-1", warranty_months: 12 },
      rating: 4.5,
      category: "electronics",
      featured: true,
    },
  },
  {
    product_id: "4",
    name: "Mechanical Keyboard",
    description:
      "Compact 75% mechanical keyboard with hot-swappable switches.",
    sku: "PRD-0004",
    category: "electronics",
    price_amount: "8999",
    inventory: 40,
    image_url: "https://picsum.photos/seed/PRD-0004/400/300",
    meta: {
      brand: "TechCore",
      specs: { model: "ELEC-2", warranty_months: 12 },
      rating: 4.7,
      category: "electronics",
      featured: false,
    },
  },
  {
    product_id: "5",
    name: "USB-C Fast Charger",
    description: "20W USB-C charger that fast-charges phones and tablets.",
    sku: "PRD-0005",
    category: "electronics",
    price_amount: "1999",
    inventory: 150,
    image_url: "https://picsum.photos/seed/PRD-0005/400/300",
    meta: {
      brand: "TechCore",
      specs: { model: "ELEC-3", warranty_months: 12 },
      rating: 4.2,
      category: "electronics",
      featured: false,
    },
  },
  {
    product_id: "6",
    name: "Stainless Steel Water Bottle",
    description: "Insulated 750ml bottle that keeps drinks cold for 24 hours.",
    sku: "PRD-0006",
    category: "home",
    price_amount: "2499",
    inventory: 120,
    image_url: "https://picsum.photos/seed/PRD-0006/400/300",
    meta: {
      brand: "HomeNest",
      specs: { model: "HOME-1", warranty_months: 6 },
      rating: 4.3,
      category: "home",
      featured: false,
    },
  },
  {
    product_id: "7",
    name: "Ceramic Coffee Mug",
    description: "A 350ml matte-finish mug, microwave and dishwasher safe.",
    sku: "PRD-0007",
    category: "home",
    price_amount: "1499",
    inventory: 200,
    image_url: "https://picsum.photos/seed/PRD-0007/400/300",
    meta: {
      brand: "HomeNest",
      specs: { model: "HOME-2", warranty_months: 6 },
      rating: 4.1,
      category: "home",
      featured: false,
    },
  },
  {
    product_id: "8",
    name: "LED Desk Lamp",
    description: "Adjustable desk lamp with three brightness levels and USB port.",
    sku: "PRD-0008",
    category: "home",
    price_amount: "2899",
    inventory: 55,
    image_url: "https://picsum.photos/seed/PRD-0008/400/300",
    meta: {
      brand: "HomeNest",
      specs: { model: "HOME-3", warranty_months: 12 },
      rating: 4.4,
      category: "home",
      featured: false,
    },
  },
  {
    product_id: "9",
    name: "Yoga Mat",
    description: "Non-slip 6mm exercise mat with a carrying strap.",
    sku: "PRD-0009",
    category: "sports",
    price_amount: "3599",
    inventory: 60,
    image_url: "https://picsum.photos/seed/PRD-0009/400/300",
    meta: {
      brand: "FitGear",
      specs: { model: "SPORT-1", warranty_months: 6 },
      rating: 4.4,
      category: "sports",
      featured: false,
    },
  },
  {
    product_id: "10",
    name: "Running Shoes",
    description: "Lightweight breathable running shoes for daily training.",
    sku: "PRD-0010",
    category: "sports",
    price_amount: "6499",
    inventory: 35,
    image_url: "https://picsum.photos/seed/PRD-0010/400/300",
    meta: {
      brand: "FitGear",
      specs: { model: "SPORT-2", warranty_months: 6 },
      rating: 4.6,
      category: "sports",
      featured: true,
    },
  },
  {
    product_id: "11",
    name: "Clean Code",
    description: "A handbook of agile software craftsmanship by Robert C. Martin.",
    sku: "PRD-0011",
    category: "books",
    price_amount: "4299",
    inventory: 0,
    image_url: "https://picsum.photos/seed/PRD-0011/400/300",
    meta: {
      brand: "PagePress",
      specs: { model: "BOOK-1", warranty_months: 0 },
      rating: 4.5,
      category: "books",
      featured: false,
    },
  },
  {
    product_id: "12",
    name: "The Pragmatic Programmer",
    description: "A classic software engineering book, 20th anniversary edition.",
    sku: "PRD-0012",
    category: "books",
    price_amount: "3999",
    inventory: 80,
    image_url: "https://picsum.photos/seed/PRD-0012/400/300",
    meta: {
      brand: "PagePress",
      specs: { model: "BOOK-2", warranty_months: 0 },
      rating: 4.8,
      category: "books",
      featured: true,
    },
  },
];

/**
 * The list of categories used by the product filter dropdown.
 * We build it from the mock products so it always stays in sync with the data.
 *
 * "new Set(...)" removes duplicate category names, and the spread operator
 * "[...set]" turns the Set back into a normal array.
 */
export const PRODUCT_CATEGORIES: string[] = [
  ...new Set(
    MOCK_API_PRODUCTS.map(function (product) {
      return product.category;
    }),
  ),
];
