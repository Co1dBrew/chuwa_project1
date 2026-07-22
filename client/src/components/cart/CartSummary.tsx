/*
 * CartSummary shows the money breakdown for the cart: subtotal, discount, and
 * the final total, plus a checkout button.
 *
 * It reads the amounts from the store through selectors, so it always matches
 * whatever is currently in the cart.
 */

import { Button, Divider } from "antd";
import { useAppSelector } from "../../app/hooks";
import {
  selectDiscountCents,
  selectSubtotalCents,
  selectTotalCents,
} from "../../features/cart/cartSelectors";
import { formatCents } from "../../utils/currency";

interface CartSummaryProps {
  /** Called when the user clicks "Checkout". */
  onCheckout: () => void;
  /** true while the checkout request is running (shows a loading button). */
  checkoutLoading?: boolean;
}

function CartSummary({ onCheckout, checkoutLoading = false }: CartSummaryProps) {
  const subtotalCents = useAppSelector(selectSubtotalCents);
  const discountCents = useAppSelector(selectDiscountCents);
  const totalCents = useAppSelector(selectTotalCents);

  // Reusable little row of "label ....... amount".
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

      {/* Only show the discount line when there actually is a discount. */}
      {discountCents > 0
        ? renderRow("Discount", "-" + formatCents(discountCents), false)
        : null}

      <Divider style={{ margin: "12px 0" }} />

      {renderRow("Total", formatCents(totalCents), true)}

      {/*
       * The Checkout button is always enabled here. We do not disable it for a
       * $0 total, because a total of $0 is a valid fully-discounted order. The
       * "empty cart" case never reaches this component: CartPage shows an empty
       * state instead of the summary when there are no items.
       */}
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
