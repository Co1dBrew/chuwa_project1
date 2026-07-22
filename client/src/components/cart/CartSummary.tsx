// CartSummary shows the subtotal, discount, and total plus a checkout button.

import { Button, Divider } from "antd";
import { useAppSelector } from "../../app/hooks";
import {
  selectDiscountCents,
  selectSubtotalCents,
  selectTotalCents,
} from "../../features/cart/cartSelectors";
import { formatCents } from "../../utils/currency";

interface CartSummaryProps {
  onCheckout: () => void;
  checkoutLoading?: boolean;
}

function CartSummary({ onCheckout, checkoutLoading = false }: CartSummaryProps) {
  const subtotalCents = useAppSelector(selectSubtotalCents);
  const discountCents = useAppSelector(selectDiscountCents);
  const totalCents = useAppSelector(selectTotalCents);

  function renderRow(label: string, amount: string, bold: boolean) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          margin: "8px 0",
          fontWeight: bold ? 700 : 400,
          fontSize: bold ? 18 : 14,
        }}
      >
        <span>{label}</span>
        <span>{amount}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #f0f0f0",
        borderRadius: 8,
        padding: 24,
        backgroundColor: "#ffffff",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Order summary</h3>

      {renderRow("Subtotal", formatCents(subtotalCents), false)}

      {/* Only show the discount line when there is a discount. */}
      {discountCents > 0
        ? renderRow("Discount", "-" + formatCents(discountCents), false)
        : null}

      <Divider style={{ margin: "12px 0" }} />

      {renderRow("Total", formatCents(totalCents), true)}

      {/* Always enabled: a $0 total is a valid fully-discounted order, and the
          empty-cart case never renders this component. */}
      <Button
        type="primary"
        block
        style={{ marginTop: 16 }}
        loading={checkoutLoading}
        onClick={onCheckout}
      >
        Checkout
      </Button>
    </div>
  );
}

export default CartSummary;
