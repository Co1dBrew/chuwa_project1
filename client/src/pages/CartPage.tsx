/*
 * CartPage shows everything in the shopping cart.
 *
 * Layout:
 *   - Left column : the list of cart items (each with a quantity control).
 *   - Right column: the promotion code box and the order summary.
 *
 * All of the data comes from the cart slice, so this page always agrees with the
 * header badge and the product pages. Checkout is a demo: it shows a message and
 * empties the cart.
 *
 * This page is wrapped in ProtectedRoute, so only signed-in users can reach it.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Col, Row, message } from "antd";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectCartItems } from "../features/cart/cartSelectors";
import { clearCart } from "../features/cart/cartSlice";
import { reduceStockForPurchase } from "../services/productService";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import PromotionCodeForm from "../components/cart/PromotionCodeForm";
import EmptyState from "../components/common/EmptyState";

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);

  // true while the checkout request is running (disables the button).
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      // Tell the service which products and quantities were bought, so it can
      // reduce their stock. (In a real app this would place an order.)
      const purchases = items.map(function (item) {
        return { productId: item.productId, quantity: item.quantity };
      });
      await reduceStockForPurchase(purchases);

      message.success("Order placed! Thank you for shopping. (This is a demo.)");
      dispatch(clearCart());
      navigate("/products");
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Checkout failed.";
      message.error(messageText);
    } finally {
      setCheckoutLoading(false);
    }
  }

  // If the cart is empty, show a friendly message and a link to keep shopping.
  if (items.length === 0) {
    return (
      <div>
        <h1>Your cart</h1>
        <EmptyState message="Your cart is empty.">
          <Link to="/products">
            <Button type="primary">Browse products</Button>
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <h1>Your cart</h1>

      <Row gutter={[32, 24]}>
        {/* Left: the list of items. */}
        <Col xs={24} md={16}>
          {items.map(function (item) {
            return <CartItem key={item.productId} item={item} />;
          })}
        </Col>

        {/* Right: promotion code and order summary. */}
        <Col xs={24} md={8}>
          <PromotionCodeForm />
          <CartSummary onCheckout={handleCheckout} checkoutLoading={checkoutLoading} />
        </Col>
      </Row>
    </div>
  );
}

export default CartPage;
