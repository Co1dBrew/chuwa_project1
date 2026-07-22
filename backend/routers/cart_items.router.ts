import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../auth.js";
import {
  type CartItem,
  createCartItem,
  decrementCartItem,
  deleteCartItem,
  getCartByUserId,
  getCartItem,
  incrementCartItem,
  isForeignKeyViolation,
  isUniqueViolation,
  setCartItemQuantity,
} from "../db.js";
import { AppError } from "../error.js";
import { imageStorage } from "../images/provider.js";
import { MAX_POSTGRES_INTEGER } from "../utils.js";
import { parse } from "../validation.js";

const router = Router();

router.use(authenticate, requireRole("customer"));

router.get("/", async (req, res) => {
  const cart = await getCartByUserId(req.auth!.userId);
  res.json({
    ...cart,
    items: cart.items.map(({ item, quantity }) => {
      const { image_key, ...product } = item;

      return {
        item: {
          ...product,
          image_url: image_key ? imageStorage.getPublicUrl(image_key) : null,
        },
        quantity,
      };
    }),
  });
});

export const CartItemInput = z.object({
  product_id: z.number().int().positive().max(MAX_POSTGRES_INTEGER),
  quantity: z.number().int().positive().max(MAX_POSTGRES_INTEGER),
});

const ProductId = z.coerce.number().int().positive().max(MAX_POSTGRES_INTEGER);
const QuantityInput = CartItemInput.pick({ quantity: true });

function requireCartItem<T>(cartItem: T | undefined): T {
  if (!cartItem) {
    throw new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found");
  }

  return cartItem;
}

router.post("/", async (req, res) => {
  const cartItemInput = parse(CartItemInput, req.body);
  let cartItem: CartItem;

  try {
    cartItem = await createCartItem({
      user_id: req.auth!.userId,
      ...cartItemInput,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError(409, "CART_ITEM_ALREADY_EXISTS", "Item is in cart");
    }

    if (isForeignKeyViolation(error)) {
      throw new AppError(
        422,
        "CART_ITEM_REFERENCE_NOT_FOUND",
        "The product or account no longer exists",
      );
    }

    throw error;
  }

  res.status(201).location(`/cart-items/${cartItem.product_id}`).json(cartItem);
});

router.patch("/:productId", async (req, res) => {
  const productId = parse(ProductId, req.params.productId);
  const { quantity } = parse(QuantityInput, req.body);
  const cartItem = requireCartItem(
    await setCartItemQuantity(req.auth!.userId, productId, quantity),
  );

  res.json(cartItem);
});

router.post("/:productId/increment", async (req, res) => {
  const productId = parse(ProductId, req.params.productId);
  const cartItem = requireCartItem(
    await incrementCartItem(req.auth!.userId, productId),
  );

  res.json(cartItem);
});

router.post("/:productId/decrement", async (req, res) => {
  const productId = parse(ProductId, req.params.productId);
  const cartItem = await decrementCartItem(req.auth!.userId, productId);

  if (!cartItem) {
    // Distinguish a missing item from an item already at quantity one.
    requireCartItem(await getCartItem(req.auth!.userId, productId));

    throw new AppError(
      409,
      "CART_QUANTITY_TOO_LOW",
      "Cannot reduce cart quantity below one",
    );
  }

  res.json(cartItem);
});

router.delete("/:productId", async (req, res) => {
  const productId = parse(ProductId, req.params.productId);
  requireCartItem(await deleteCartItem(req.auth!.userId, productId));

  res.status(204).end();
});

export default router;
