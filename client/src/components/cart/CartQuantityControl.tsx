/*
 * CartQuantityControl is the little "minus / number / plus" control used to
 * change how many of an item are in the cart.
 *
 * It is presentational: it does not touch the Redux store itself. It just shows
 * the current quantity and calls the callbacks the parent gives it. The parent
 * (CartItem) is the one that dispatches the actual changes. This keeps the
 * control reusable anywhere a quantity needs picking.
 *
 * It enforces the limits visually:
 *   - the minus button is disabled at quantity 1 (never go to 0 here)
 *   - the plus button is disabled once the quantity reaches the stock
 */

import { Button, InputNumber, Space } from "antd";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";

interface CartQuantityControlProps {
  quantity: number;
  stock: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onSetQuantity: (quantity: number) => void;
}

function CartQuantityControl({
  quantity,
  stock,
  onIncrease,
  onDecrease,
  onSetQuantity,
}: CartQuantityControlProps) {
  // InputNumber gives us a number, or null if the box is empty. If it is null
  // we simply ignore the change until a real number is typed.
  function handleInputChange(value: number | null) {
    if (value !== null) {
      onSetQuantity(value);
    }
  }

  return (
    <Space.Compact>
      <Button
        icon={<MinusOutlined />}
        onClick={onDecrease}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
      />
      <InputNumber
        min={1}
        max={stock}
        precision={0}
        value={quantity}
        onChange={handleInputChange}
        style={{ width: 64 }}
        controls={false}
      />
      <Button
        icon={<PlusOutlined />}
        onClick={onIncrease}
        disabled={quantity >= stock}
        aria-label="Increase quantity"
      />
    </Space.Compact>
  );
}

export default CartQuantityControl;
