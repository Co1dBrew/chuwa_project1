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

const ProductInput = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().min(1),
  category_id: z.number().int(),
  price_amount: z.number().int(),
  inventory: z.number().int().optional(),
  image_url: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

router.post("/", async (req, res) => {
  const productInput = ProductInput.parse(req.body);
  const product = await createProduct(productInput);

  res.status(201).location(`/products/${product.product_id}`).json(product);
});

export default router;
