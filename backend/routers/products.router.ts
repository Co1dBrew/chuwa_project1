import { Router } from "express";
import { z } from "zod";
import {
  createProduct,
  getProductById,
  getProducts,
  isForeignKeyViolation,
  isUniqueViolation,
} from "../db.js";
import { AppError } from "../error.js";
import { MAX_POSTGRES_INTEGER } from "../utils.js";
import { parse } from "../validation.js";

const router = Router();

const QuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.coerce
    .number()
    .int()
    .nonnegative()
    .max(MAX_POSTGRES_INTEGER)
    .optional(),
});

router.get("/", async (req, res) => {
  const { limit, cursor } = parse(QuerySchema, req.query);
  const products = await getProducts(limit, cursor);

  res.json(products);
});

const ProductIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(MAX_POSTGRES_INTEGER);

router.get("/:productId", async (req, res) => {
  const productId = parse(ProductIdSchema, req.params.productId);
  const product = await getProductById(productId);

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  res.json(product);
});

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().trim().pipe(z.url()).optional(),
);

export const ProductInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalString,
  sku: z.string().trim().min(1).max(100),
  category_id: z.number().int().positive().max(MAX_POSTGRES_INTEGER),
  price_amount: z.number().int().nonnegative().max(MAX_POSTGRES_INTEGER),
  inventory: z
    .number()
    .int()
    .nonnegative()
    .max(MAX_POSTGRES_INTEGER)
    .optional(),
  image_url: optionalUrl,
  meta: z.record(z.string(), z.unknown()).optional(),
});

router.post("/", async (req, res) => {
  const productInput = parse(ProductInput, req.body);
  let product: Awaited<ReturnType<typeof createProduct>>;

  try {
    product = await createProduct(productInput);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(
        409,
        "SKU_ALREADY_EXISTS",
        "A product with this SKU already exists",
      );
    }

    if (isForeignKeyViolation(error)) {
      throw new AppError(
        422,
        "INVALID_CATEGORY",
        "The selected category does not exist",
      );
    }

    throw error;
  }

  res.status(201).location(`/products/${product.product_id}`).json(product);
});

export default router;
