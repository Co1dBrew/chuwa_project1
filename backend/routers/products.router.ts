import { Router } from "express";
import { z } from "zod";
import { createProduct, getProductById, getProducts } from "../db.js";

const router = Router();

const QuerySchema = z.object({
  limit: z.coerce.number().int().positive().optional(),
  cursor: z.coerce.number().int().nonnegative().optional(),
});

router.get("/", async (req, res) => {
  try {
    const { limit, cursor } = QuerySchema.parse(req.query);
    const products = await getProducts(limit, cursor);

    res.json(products);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch products",
    });
  }
});

const ProductIdSchema = z.coerce.number().int().positive();

router.get("/:productId", async (req, res) => {
  try {
    const productId = ProductIdSchema.parse(req.params.productId);
    const product = await getProductById(productId);

    res.json(product);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch product",
    });
  }
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
  category_id: z.number().int().positive(),
  price_amount: z.number().int().nonnegative(),
  inventory: z.number().int().nonnegative().optional(),
  image_url: optionalUrl,
  meta: z.record(z.string(), z.unknown()).optional(),
});

router.post("/", async (req, res) => {
  const productInput = ProductInput.parse(req.body);
  const product = await createProduct(productInput);

  res.status(201).location(`/products/${product.product_id}`).json(product);
});

export default router;
