// Shows the shopping cart items, promo code, and order summary (signed-in only).

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Col, Row, message } from "antd";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectCartItems } from "../features/cart/cartSelectors";
import { checkoutThunk } from "../features/cart/cartSlice";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import PromotionCodeForm from "../components/cart/PromotionCodeForm";
import EmptyState from "../components/common/EmptyState";

function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleCheckout() {
    setCheckoutLoading(true);
    try {
      // Place the order: empty the backend cart. (Stock reduction is not wired
      // up yet, so this is a demo checkout.)
      await dispatch(checkoutThunk()).unwrap();

      message.success("Order placed! Thank you for shopping. (This is a demo.)");
      navigate("/products");
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Checkout failed.";
      message.error(messageText);
    } finally {
      setCheckoutLoading(false);
    }
  }

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
        <Col xs={24} md={16}>
          {items.map(function (item) {
            return <CartItem key={item.productId} item={item} />;
          })}
        </Col>

        <Col xs={24} md={8}>
          <PromotionCodeForm />
          <CartSummary onCheckout={handleCheckout} checkoutLoading={checkoutLoading} />
        </Col>
      </Row>
    </div>
  );
}

export default CartPage;
