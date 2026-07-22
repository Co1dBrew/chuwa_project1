/*
 * CartItem shows one line in the shopping cart: image, name, unit price, the
 * quantity control, the line subtotal, and a remove button.
 *
 * This component dispatches the cart changes itself (increase, decrease, set an
 * exact quantity, remove). It reads nothing but the single item it is given
 * through props, which keeps it simple.
 */

import { Button, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { CartItem as CartItemType } from "../../types/cart";
import { useAppDispatch } from "../../app/hooks";
import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  setQuantity,
} from "../../features/cart/cartSlice";
import { formatCents } from "../../utils/currency";
import CartQuantityControl from "./CartQuantityControl";

interface CartItemProps {
  item: CartItemType;
}

function CartItem({ item }: CartItemProps) {
  const dispatch = useAppDispatch();

  // The subtotal for this line is unit price times quantity.
  const lineSubtotalCents = item.priceCents * item.quantity;

  function handleIncrease() {
    dispatch(increaseQuantity(item.productId));
  }

  function handleDecrease() {
    dispatch(decreaseQuantity(item.productId));
  }

  function handleSetQuantity(quantity: number) {
    dispatch(setQuantity({ productId: item.productId, quantity: quantity }));
  }

  function handleRemove() {
    dispatch(removeFromCart(item.productId));
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "16px 0",
        borderBottom: "1px solid #f0f0f0",
        flexWrap: "wrap",
      }}
    >
      <Link to={"/products/" + item.productId}>
        <img
          src={item.imageUrl}
          alt={item.name}
          style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8 }}
        />
      </Link>

      <div style={{ flex: 1, minWidth: 140 }}>
        <Link to={"/products/" + item.productId}>
          <strong>{item.name}</strong>
        </Link>
        <div style={{ color: "#888" }}>{formatCents(item.priceCents)} each</div>
      </div>

      <CartQuantityControl
        quantity={item.quantity}
        stock={item.stock}
        onIncrease={handleIncrease}
        onDecrease={handleDecrease}
        onSetQuantity={handleSetQuantity}
      />

      {/* The subtotal for this line. */}
      <div style={{ width: 90, textAlign: "right", fontWeight: 600 }}>
        {formatCents(lineSubtotalCents)}
      </div>

      <Space>
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={handleRemove}
          aria-label="Remove item"
        />
      </Space>
    </div>
  );
}

export default CartItem;
