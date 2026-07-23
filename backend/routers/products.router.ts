import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../auth.js";
import {
  type Product,
  createProduct,
  deleteProduct,
  getProductById,
  isForeignKeyViolation,
  isUniqueViolation,
  listProductsPaged,
  updateProduct,
  updateProductImageKey,
} from "../db.js";
import { AppError } from "../error.js";
import { imageStorage } from "../images/provider.js";
import { saveUploadedImage, uploadImage } from "../images/upload.js";
import { MAX_POSTGRES_INTEGER } from "../utils.js";
import { parse } from "../validation.js";

const router = Router();

function toProductResponse(product: Product) {
  const { image_key, ...publicProduct } = product;

  return {
    ...publicProduct,
    image_url: image_key ? imageStorage.getPublicUrl(image_key) : null,
  };
}

async function requireOwnedProduct(productId: number, merchantId: number) {
  const product = await getProductById(productId);

  if (!product) {
    throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
  }

  if (product.merchant_id !== merchantId) {
    throw new AppError(403, "FORBIDDEN", "You do not own this product");
  }

  return product;
}

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 100;

const QuerySchema = z.object({
  search: z.string().trim().optional(),
  category_id: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_POSTGRES_INTEGER)
    .optional(),
  page: z.coerce.number().int().positive().max(MAX_POSTGRES_INTEGER).optional(),
  pageSize: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).optional(),
});

router.get("/", async (req, res) => {
  const query = parse(QuerySchema, req.query);
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;

  const { rows, total } = await listProductsPaged({
    search: query.search,
    categoryId: query.category_id,
    page,
    pageSize,
  });

  res.json({
    items: rows.map(toProductResponse),
    total,
    page,
    pageSize,
  });
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

  res.json(toProductResponse(product));
});

router.post(
  "/:productId/image",
  authenticate,
  requireRole("merchant"),
  uploadImage,
  async (req, res) => {
    const productId = parse(ProductIdSchema, req.params.productId);
    const merchantId = req.auth!.userId;
    const existingProduct = await requireOwnedProduct(productId, merchantId);

    const imageKey = await saveUploadedImage(req, "products");
    const product = await updateProductImageKey(
      productId,
      merchantId,
      imageKey,
    );

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    if (existingProduct.image_key) {
      await imageStorage.delete(existingProduct.image_key);
    }

    res.json(toProductResponse(product));
  },
);

const optionalString = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const optionalInteger = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.coerce.number().int().nonnegative().max(MAX_POSTGRES_INTEGER).optional(),
);

const optionalMeta = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}, z.record(z.string(), z.unknown()).optional());

function throwProductWriteError(error: unknown): never {
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

export const ProductInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: optionalString,
  sku: z.string().trim().min(1).max(100),
  category_id: z.coerce.number().int().positive().max(MAX_POSTGRES_INTEGER),
  price_amount: z.coerce.number().int().nonnegative().max(MAX_POSTGRES_INTEGER),
  inventory: optionalInteger,
  meta: optionalMeta,
});

const ProductUpdateInput = ProductInput.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  "Provide at least one field to update",
);

router.post(
  "/",
  authenticate,
  requireRole("merchant"),
  uploadImage,
  async (req, res) => {
    const productInput = parse(ProductInput, req.body);
    const imageKey = req.file
      ? await saveUploadedImage(req, "products")
      : undefined;
    let product: Product;

    try {
      product = await createProduct({
        ...productInput,
        merchant_id: req.auth!.userId,
        image_key: imageKey,
      });
    } catch (error) {
      if (imageKey) {
        await imageStorage.delete(imageKey);
      }

      throwProductWriteError(error);
    }

    res
      .status(201)
      .location(`/products/${product.product_id}`)
      .json(toProductResponse(product));
  },
);

router.delete(
  "/:productId",
  authenticate,
  requireRole("merchant"),
  async (req, res) => {
    const productId = parse(ProductIdSchema, req.params.productId);
    const merchantId = req.auth!.userId;

    await requireOwnedProduct(productId, merchantId);

    const deletedProduct = await deleteProduct(productId, merchantId);

    if (!deletedProduct) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    if (deletedProduct.image_key) {
      await imageStorage.delete(deletedProduct.image_key);
    }

    res.status(204).end();
  },
);

router.patch(
  "/:productId",
  authenticate,
  requireRole("merchant"),
  async (req, res) => {
    const productId = parse(ProductIdSchema, req.params.productId);
    const merchantId = req.auth!.userId;

    await requireOwnedProduct(productId, merchantId);
    const productInput = parse(ProductUpdateInput, req.body);

    let product: Product | undefined;

    try {
      product = await updateProduct(productId, merchantId, productInput);
    } catch (error) {
      throwProductWriteError(error);
    }

    if (!product) {
      throw new AppError(404, "PRODUCT_NOT_FOUND", "Product not found");
    }

    res.json(toProductResponse(product));
  },
);

export default router;
