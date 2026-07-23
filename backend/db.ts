import { Pool } from "pg";
import { requireEnv } from "./utils.js";

const DATABASE_URL = requireEnv("DATABASE_URL");

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const CATEGORY_COLUMNS = "category_id, name";
const PRODUCT_COLUMNS = `product_id, merchant_id, name, description, sku, category_id,
                         price_amount, inventory, image_key, meta`;
const USER_COLUMNS =
  "user_id, username, email, password_hash, nickname, avatar_key, role";
const CART_COLUMNS = "user_id, product_id, quantity";

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

export interface Product {
  product_id: number;
  merchant_id: number;
  name: string;
  description: string | null;
  sku: string;
  category_id: number;
  price_amount: number;
  inventory: number;
  image_key: string | null;
  meta: Record<string, unknown>;
}

export interface CreateProductInput {
  merchant_id: number;
  name: string;
  description?: string;
  sku: string;
  category_id: number;
  price_amount: number;
  inventory?: number;
  image_key?: string;
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

function requireReturnedRow<T>(rows: T[], resource: string): T {
  const row = rows[0];

  if (!row) {
    throw new Error(`${resource} insert succeeded without returning a row`);
  }

  return row;
}

export async function getCategories(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT ${CATEGORY_COLUMNS}
     FROM categories
     ORDER BY name`,
  );
  return result.rows;
}

export async function getProductById(id: number): Promise<Product | undefined> {
  const result = await pool.query<Product>(
    `SELECT ${PRODUCT_COLUMNS}
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
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     WHERE product_id > $1
     ORDER BY product_id
     LIMIT $2`,
    [cursor, limit],
  );

  return result.rows;
}

export interface ProductListFilters {
  search?: string;
  categoryId?: number;
  page: number;
  pageSize: number;
}

export async function listProductsPaged(
  filters: ProductListFilters,
): Promise<{ rows: Product[]; total: number }> {
  const { search, categoryId, page, pageSize } = filters;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (search !== undefined && search.trim() !== "") {
    values.push(`%${search.trim()}%`);
    conditions.push(
      `(name ILIKE $${values.length} OR description ILIKE $${values.length})`,
    );
  }

  if (categoryId !== undefined) {
    values.push(categoryId);
    conditions.push(`category_id = $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM products ${whereClause}`,
    values,
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const offset = (page - 1) * pageSize;
  const result = await pool.query<Product>(
    `SELECT ${PRODUCT_COLUMNS}
     FROM products
     ${whereClause}
     ORDER BY product_id
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, pageSize, offset],
  );

  return { rows: result.rows, total };
}

export async function createProduct(
  product: CreateProductInput,
): Promise<Product> {
  const [columns, values] = toColumnsAndValuesIgnoringUndefined(product);
  const placeholders = values.map((_, i) => `$${i + 1}`);

  const { rows } = await pool.query<Product>(
    `
      INSERT INTO products (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING ${PRODUCT_COLUMNS}
    `,
    values,
  );

  return requireReturnedRow(rows, "Product");
}

export async function updateProductImageKey(
  productId: number,
  merchantId: number,
  imageKey: string,
): Promise<Product | undefined> {
  const result = await pool.query<Product>(
    `UPDATE products
     SET image_key = $3
     WHERE product_id = $1 AND merchant_id = $2
     RETURNING ${PRODUCT_COLUMNS}`,
    [productId, merchantId, imageKey],
  );

  return result.rows[0];
}

export async function deleteProduct(
  productId: number,
  merchantId: number,
): Promise<Product | undefined> {
  const result = await pool.query<Product>(
    `DELETE FROM products
     WHERE product_id = $1 AND merchant_id = $2
     RETURNING ${PRODUCT_COLUMNS}`,
    [productId, merchantId],
  );

  return result.rows[0];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  sku?: string;
  category_id?: number;
  price_amount?: number;
  inventory?: number;
  meta?: Record<string, unknown>;
}

export async function updateProduct(
  productId: number,
  merchantId: number,
  input: UpdateProductInput,
): Promise<Product | undefined> {
  const [columns, values] = toColumnsAndValuesIgnoringUndefined(input);

  // Nothing to change: just return the current product (if owned).
  if (columns.length === 0) {
    const existing = await getProductById(productId);
    return existing && existing.merchant_id === merchantId
      ? existing
      : undefined;
  }

  const setClause = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");

  const result = await pool.query<Product>(
    `UPDATE products
     SET ${setClause}
     WHERE product_id = $${columns.length + 1}
       AND merchant_id = $${columns.length + 2}
     RETURNING ${PRODUCT_COLUMNS}`,
    [...values, productId, merchantId],
  );

  return result.rows[0];
}

export interface User {
  user_id: number;
  username: string;
  email: string;
  password_hash: string;
  nickname: string | null;
  avatar_key: string | null;
  role: UserRole;
}

export type UserRole = "customer" | "merchant";

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
  nickname?: string;
  avatar_key?: string;
  role: UserRole;
}

export async function createUser(user: CreateUserInput): Promise<User> {
  const [columns, values] = toColumnsAndValuesIgnoringUndefined(user);
  const placeholders = values.map((_, i) => `$${i + 1}`);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const { rows } = await client.query<User>(
      `
        INSERT INTO users (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING ${USER_COLUMNS}
      `,
      values,
    );
    const createdUser = requireReturnedRow(rows, "User");
    const profileTable =
      createdUser.role === "customer"
        ? "customer_profiles"
        : "merchant_profiles";

    await client.query(`INSERT INTO ${profileTable} (user_id) VALUES ($1)`, [
      createdUser.user_id,
    ]);
    await client.query("COMMIT");
    return createdUser;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateUserAvatarKey(
  userId: number,
  avatarKey: string,
): Promise<User | undefined> {
  const result = await pool.query<User>(
    `UPDATE users
     SET avatar_key = $2
     WHERE user_id = $1
     RETURNING ${USER_COLUMNS}`,
    [userId, avatarKey],
  );

  return result.rows[0];
}

export async function getUserById(id: number): Promise<User | undefined> {
  const result = await pool.query<User>(
    `SELECT ${USER_COLUMNS}
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
    `SELECT ${USER_COLUMNS}
     FROM users
     WHERE LOWER(username) = $1`,
    [username.toLowerCase()],
  );
  return result.rows[0];
}

interface Cart {
  user_id: number;
  items: { item: Product; quantity: number }[];
}

interface CartProductRow extends Product {
  quantity: number;
}

export async function getCartByUserId(userId: number): Promise<Cart> {
  const result = await pool.query<CartProductRow>(
    `SELECT cart_items.quantity,
            products.product_id, products.merchant_id, products.name,
            products.description, products.sku, products.category_id,
            products.price_amount,
            products.inventory, products.image_key, products.meta
     FROM cart_items
     JOIN products ON products.product_id = cart_items.product_id
     WHERE cart_items.user_id = $1
     ORDER BY cart_items.product_id`,
    [userId],
  );

  const items = result.rows.map(({ quantity, ...item }) => ({
    quantity,
    item,
  }));

  return { user_id: userId, items };
}

export interface CartItem {
  user_id: number;
  product_id: number;
  quantity: number;
}

export async function createCartItem(cartItem: CartItem): Promise<CartItem> {
  const { user_id, product_id, quantity } = cartItem;

  const { rows } = await pool.query<CartItem>(
    `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      RETURNING ${CART_COLUMNS}
    `,
    [user_id, product_id, quantity],
  );

  return requireReturnedRow(rows, "Cart item");
}

export async function getCartItem(
  userId: number,
  productId: number,
): Promise<CartItem | undefined> {
  const result = await pool.query<CartItem>(
    `SELECT ${CART_COLUMNS}
     FROM cart_items
     WHERE user_id = $1 AND product_id = $2`,
    [userId, productId],
  );

  return result.rows[0];
}

export async function setCartItemQuantity(
  userId: number,
  productId: number,
  quantity: number,
): Promise<CartItem | undefined> {
  const result = await pool.query<CartItem>(
    `UPDATE cart_items
     SET quantity = $3
     WHERE user_id = $1 AND product_id = $2
     RETURNING ${CART_COLUMNS}`,
    [userId, productId, quantity],
  );

  return result.rows[0];
}

async function changeCartItemQuantity(
  userId: number,
  productId: number,
  amount: number,
): Promise<CartItem | undefined> {
  const result = await pool.query<CartItem>(
    `UPDATE cart_items
     SET quantity = quantity + $3
     WHERE user_id = $1
       AND product_id = $2
       AND quantity + $3 > 0
     RETURNING ${CART_COLUMNS}`,
    [userId, productId, amount],
  );

  return result.rows[0];
}

export async function incrementCartItem(
  userId: number,
  productId: number,
): Promise<CartItem | undefined> {
  return changeCartItemQuantity(userId, productId, 1);
}

export async function decrementCartItem(
  userId: number,
  productId: number,
): Promise<CartItem | undefined> {
  return changeCartItemQuantity(userId, productId, -1);
}

export async function deleteCartItem(
  userId: number,
  productId: number,
): Promise<CartItem | undefined> {
  const result = await pool.query<CartItem>(
    `DELETE FROM cart_items
     WHERE user_id = $1 AND product_id = $2
     RETURNING ${CART_COLUMNS}`,
    [userId, productId],
  );

  return result.rows[0];
}
