// Loads the product categories from the backend (GET /categories) and provides
// small helpers to convert between a category's name and its numeric id.
// The result is cached in memory so we only fetch the list once.

import type { Category } from "../types/product";
import { request } from "./httpClient";

// The raw shape the backend returns for a category.
interface ApiCategory {
  category_id: number;
  name: string;
}

// Cached list; null until the first successful fetch.
let cachedCategories: Category[] | null = null;

// Get all categories (fetched once, then cached).
export async function getCategories(): Promise<Category[]> {
  if (cachedCategories !== null) {
    return cachedCategories;
  }

  const apiCategories = await request<ApiCategory[]>("/categories");

  cachedCategories = apiCategories.map(function (apiCategory) {
    return { id: String(apiCategory.category_id), name: apiCategory.name };
  });

  return cachedCategories;
}

// Build a "category id -> name" lookup (used when mapping products).
export async function getCategoryNameById(): Promise<Record<number, string>> {
  const categories = await getCategories();

  const nameById: Record<number, string> = {};
  for (const category of categories) {
    nameById[Number(category.id)] = category.name;
  }
  return nameById;
}

// Find the numeric id for a category name, or undefined if there is no match.
export async function getCategoryIdByName(
  name: string,
): Promise<number | undefined> {
  const categories = await getCategories();

  const found = categories.find(function (category) {
    return category.name === name;
  });

  return found !== undefined ? Number(found.id) : undefined;
}
