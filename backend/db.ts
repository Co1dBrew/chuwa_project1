import { Pool } from "pg";
import { requireEnv } from "./utils.js";

const DATABASE_URL = requireEnv("DATABASE_URL");

const pool = new Pool({
  connectionString: DATABASE_URL,
});

function hasPostgresErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

export function isUniqueViolation(error: unknown): boolean {
  return hasPostgresErrorCode(error, "23505");
}

export function isForeignKeyViolation(error: unknown): boolean {
  return hasPostgresErrorCode(error, "23503");
}

export async function closeDatabase() {
  await pool.end();
}

interface Category {
  category_id: number;
  name: string;
}

interface Product {
  product_id: number;
  name: string;
  description: string | null;
  sku: string;
  category_id: number;
  price_amount: number;
  inventory: number;
  image_url: string | null;
  meta: Record<string, unknown>;
}

interface ProductInput {
  name: string;
  description?: string;
  sku: string;
  category_id: number;
  price_amount: number;
  inventory?: number;
  image_url?: string;
  meta?: Record<string, unknown>;
}

/**
 * Omit undefined properties so PostgreSQL can apply column defaults.
 */
function toColumnsAndValuesIgnoringUndefined(
  obj: object,
): [string[], unknown[]] {
  const columns: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(obj) as [string, unknown][]) {
    if (value !== undefined) {
      columns.push(key);
      values.push(value);
    }
  }

  return [columns, values];
}

export async function getCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT category_id, name
     FROM categories`,
  );
  return result.rows;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const result = await pool.query<Product>(
    `SELECT product_id, name, description, sku, category_id, price_amount,
            inventory, image_url, meta
     FROM products
     WHERE product_id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function getProducts(
  limit: number = 50,
  cursor: number = 0,
): Promise<Product[]> {
  const result = await pool.query<Product>(
    `SELECT product_id, name, description, sku, category_id, price_amount,
            inventory, image_url, meta
     FROM products
     WHERE product_id > $1
     ORDER BY product_id
     LIMIT $2`,
    [cursor, limit],
  );

  return result.rows;
}

export async function createProduct(product: ProductInput): Promise<Product> {
  const [columns, values] = toColumnsAndValuesIgnoringUndefined(product);
  const placeholders = values.map((_, i) => `$${i + 1}`);

  const { rows } = await pool.query<Product>(
    `
      INSERT INTO products (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `,
    values,
  );

  const createdProduct = rows[0];

  if (!createdProduct) {
    throw new Error("Product insert succeeded without returning a product");
  }

  return createdProduct;
}

interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  nickname: string | null;
  avatar_url: string | null;
}

interface UserInput {
  username: string;
  email: string;
  password_hash: string;
  nickname?: string;
  avatar_url?: string;
}

export async function createUser(user: UserInput): Promise<User> {
  const [columns, values] = toColumnsAndValuesIgnoringUndefined(user);
  const placeholders = values.map((_, i) => `$${i + 1}`);

  const { rows } = await pool.query<User>(
    `
      INSERT INTO users (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `,
    values,
  );

  const createdUser = rows[0];

  if (!createdUser) {
    throw new Error("User insert succeeded without returning a user");
  }

  return createdUser;
}

export async function getUserById(id: number): Promise<User | undefined> {
  const result = await pool.query<User>(
    `SELECT user_id, username, email, password_hash, nickname, avatar_url
     FROM users
     WHERE user_id = $1`,
    [id],
  );
  return result.rows[0];
}

export async function getUserByUsername(
  username: string,
): Promise<User | undefined> {
  const result = await pool.query<User>(
    `SELECT user_id, username, email, password_hash, nickname, avatar_url
     FROM users
     WHERE LOWER(username) = $1`,
    [username.toLowerCase()],
  );
  return result.rows[0];
}
