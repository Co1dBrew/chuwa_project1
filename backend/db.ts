import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  category: string;
  price_amount: number;
  inventory: number;
  image_url: string | null;
  meta: Record<string, any>;
}

interface ProductInput {
  name: string;
  description?: string;
  sku: string;
  category_id: number;
  price_amount: number;
  inventory?: number;
  image_url?: string;
  meta?: Record<string, any>;
}

/**
 * remove `undefined` properties, since these properties are meant to use default value provided by database table schema and they should not appear in the sql insertion value list
 */
function toColumnsAndValuesIgnoringUndefined(
  obj: Record<string, any>,
): [string[], any[]] {
  const columns = [];
  const values = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      columns.push(key);
      values.push(value);
    }
  }

  return [columns, values];
}

export async function getCategories() {
  try {
    const result = await pool.query<Category>(
      `SELECT category_id, name
     FROM categories`,
    );
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export async function getProductById(id: number) {
  try {
    const result = await pool.query<Product>(
      `SELECT p.product_id, p.name, p.description, p.sku, c.name as category, p.price_amount, p.inventory, p.image_url, p.meta from "products" p LEFT JOIN categories c on p.category_id = c.category_id WHERE p.product_id = $1`,
      [id],
    );
    return result.rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export async function getProducts(limit: number = 50, cursor: number = 0) {
  try {
    const result = await pool.query<Product>(
      `SELECT p.product_id, p.name, p.description, p.sku, c.name as category, p.price_amount, p.inventory, p.image_url, p.meta from "products" p LEFT JOIN categories c on p.category_id = c.category_id WHERE p.product_id > $1 ORDER BY p.product_id LIMIT $2`,
      [cursor, limit],
    );
    return result.rows;
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}

export async function createProduct(product: ProductInput) {
  try {
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

    return rows[0];
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }
}
