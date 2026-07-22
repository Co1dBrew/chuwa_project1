/*
 * ProductCard shows one product inside the product grid.
 *
 * It displays the image, name, short description, price, stock, and rating, plus
 * an "Add to cart" button. Administrators additionally see "Edit" and "Delete".
 *
 * This card reads a couple of things straight from the Redux store:
 *   - how many of THIS product are already in the cart (to show "In cart: N")
 *   - whether the current user is an admin (to decide whether to show Edit/Delete)
 * Deleting is handled by the parent page (through the onRequestDelete callback),
 * because the page also needs to refresh the list and fix the pagination.
 */

import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Rate, Space, Tag, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { Product } from "../../types/product";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToCart } from "../../features/cart/cartSlice";
import { selectQuantityForProduct } from "../../features/cart/cartSelectors";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../../features/auth/authSelectors";
import { formatCents } from "../../utils/currency";

interface ProductCardProps {
  product: Product;
  /** Called when an admin clicks "Delete"; the page opens a confirm dialog. */
  onRequestDelete: (product: Product) => void;
}

function ProductCard({ product, onRequestDelete }: ProductCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAdmin = useAppSelector(selectIsAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  // Read the quantity of THIS product currently in the cart.
  const quantityInCart = useAppSelector(function (state) {
    return selectQuantityForProduct(state, product.id);
  });

  const isOutOfStock = product.stock <= 0;

  function handleAddToCart() {
    // Only signed-in users may add to the cart. Guests are sent to sign in.
    if (!isAuthenticated) {
      message.info("Please sign in to add items to your cart.");
      navigate("/signin");
      return;
    }

    // Stop if the cart already holds every available unit of this product.
    // Without this check we would show a misleading "added" message even though
    // the cart could not actually grow past the stock limit.
    if (quantityInCart >= product.stock) {
      message.warning("No more stock available for " + product.name + ".");
      return;
    }

    dispatch(addToCart(product));
    message.success(product.name + " added to your cart.");
  }

  function handleEdit() {
    navigate("/products/" + product.id + "/edit");
  }

  function handleDelete() {
    onRequestDelete(product);
  }

  return (
    <Card
      hoverable
      // The cover is the product image, wrapped in a link to the detail page.
      cover={
        <Link to={"/products/" + product.id}>
          <img
            src={product.imageUrl}
            alt={product.name}
            style={{ height: 180, width: "100%", objectFit: "cover" }}
          />
        </Link>
      }
    >
      {/* Product name links to the detail page. */}
      <Link to={"/products/" + product.id}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{product.name}</h3>
      </Link>

      {/* A short description, cut off after two lines so cards stay even. */}
      <p
        style={{
          color: "#666",
          minHeight: 40,
          margin: "0 0 8px",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {product.description}
      </p>

      <Space size="small" style={{ marginBottom: 8 }}>
        <Rate disabled allowHalf value={product.rating} style={{ fontSize: 14 }} />
        <span style={{ color: "#999" }}>{product.rating.toFixed(1)}</span>
      </Space>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 18 }}>{formatCents(product.priceCents)}</strong>
        {isOutOfStock ? (
          <Tag color="red">Out of stock</Tag>
        ) : (
          <Tag color="green">In stock: {product.stock}</Tag>
        )}
      </div>

      {/* Show how many are already in the cart, if any. */}
      {quantityInCart > 0 ? (
        <div style={{ color: "#1677ff", marginBottom: 8 }}>
          In cart: {quantityInCart}
        </div>
      ) : null}

      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          block
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          Add to cart
        </Button>

        {/* Only administrators see the edit and delete buttons. */}
        {isAdmin ? (
          <Space style={{ width: "100%" }} size="small">
            <Button icon={<EditOutlined />} onClick={handleEdit} block>
              Edit
            </Button>
            <Button icon={<DeleteOutlined />} onClick={handleDelete} danger block>
              Delete
            </Button>
          </Space>
        ) : null}
      </Space>
    </Card>
  );
}

export default ProductCard;
