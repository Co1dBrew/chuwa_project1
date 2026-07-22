// Presentational minus/number/plus control for picking a quantity.
// Disables minus at 1 and plus once quantity reaches stock.

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
  // InputNumber passes null when the box is empty; ignore until a number is typed.
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
