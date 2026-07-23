// ProductCard shows one product inside the product grid.

import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Rate, Space, Tag, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { Product } from "../../types/product";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addToCartThunk } from "../../features/cart/cartSlice";
import { selectQuantityForProduct } from "../../features/cart/cartSelectors";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../../features/auth/authSelectors";
import { formatCents } from "../../utils/currency";
import { PLACEHOLDER_IMAGE, handleImageError } from "../../utils/imagePlaceholder";

interface ProductCardProps {
  product: Product;
  onRequestDelete: (product: Product) => void;
}

function ProductCard({ product, onRequestDelete }: ProductCardProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAdmin = useAppSelector(selectIsAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const quantityInCart = useAppSelector(function (state) {
    return selectQuantityForProduct(state, product.id);
  });

  const isOutOfStock = product.stock <= 0;

  function handleAddToCart() {
    // Only signed-in users may add to the cart; guests are sent to sign in.
    if (!isAuthenticated) {
      message.info("Please sign in to add items to your cart.");
      navigate("/signin");
      return;
    }

    // Stop if the cart already holds every available unit of this product.
    if (quantityInCart >= product.stock) {
      message.warning("No more stock available for " + product.name + ".");
      return;
    }

    // Adding to the cart now calls the backend, so it is asynchronous.
    dispatch(addToCartThunk(product))
      .unwrap()
      .then(function () {
        message.success(product.name + " added to your cart.");
      })
      .catch(function (errorMessage) {
        message.warning(
          typeof errorMessage === "string"
            ? errorMessage
            : "Could not add to cart.",
        );
      });
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
      cover={
        <Link to={"/products/" + product.id}>
          <img
            src={product.imageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            onError={handleImageError}
            style={{ height: 180, width: "100%", objectFit: "cover" }}
          />
        </Link>
      }
    >
      <Link to={"/products/" + product.id}>
        <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{product.name}</h3>
      </Link>

      {/* Description cut off after two lines so cards stay even. */}
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

      {quantityInCart > 0 ? (
        <div style={{ color: "#1677ff", marginBottom: 8 }}>
          In cart: {quantityInCart}
        </div>
      ) : null}

      <Space direction="vertical" style={{ width: "100%" }} size="small">
        {/* The cart is for regular users; admins do not see "Add to cart". */}
        {!isAdmin ? (
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            block
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            Add to cart
          </Button>
        ) : null}

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
