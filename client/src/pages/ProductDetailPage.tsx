// Shows the details of a single product, with add-to-cart and admin actions.

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Col, Rate, Row, Space, Tag, message } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import type { Product } from "../types/product";
import { deleteProduct, getProductById } from "../services/productService";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addToCartThunk } from "../features/cart/cartSlice";
import { selectQuantityForProduct } from "../features/cart/cartSelectors";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../features/auth/authSelectors";
import { formatCents } from "../utils/currency";
import { PLACEHOLDER_IMAGE, handleImageError } from "../utils/imagePlaceholder";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";
import DeleteProductModal from "../components/product/DeleteProductModal";

function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const isAdmin = useAppSelector(selectIsAdmin);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Bumping this forces a reload (used by "Try again").
  const [refreshCounter, setRefreshCounter] = useState(0);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // How many of this product are already in the cart.
  const quantityInCart = useAppSelector(function (state) {
    if (product === null) {
      return 0;
    }
    return selectQuantityForProduct(state, product.id);
  });

  // Load the product whenever the id changes or we ask for a reload.
  useEffect(
    function () {
      async function loadProduct() {
        if (productId === undefined) {
          setError("Product not found.");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const found = await getProductById(productId);
          setProduct(found);
        } catch (caughtError) {
          const messageText =
            caughtError instanceof Error
              ? caughtError.message
              : "Could not load the product.";
          setError(messageText);
        } finally {
          setLoading(false);
        }
      }

      loadProduct();
    },
    [productId, refreshCounter],
  );

  function handleRetry() {
    setRefreshCounter(function (previous) {
      return previous + 1;
    });
  }

  function handleAddToCart() {
    if (product === null) {
      return;
    }

    // Only signed-in users may add to the cart.
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

  async function handleConfirmDelete() {
    if (product === null) {
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteProduct(product.id);
      message.success(product.name + " was deleted.");
      navigate("/products");
    } catch (caughtError) {
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Delete failed.";
      message.error(messageText);
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (error !== null || product === null) {
    return (
      <div>
        <ErrorMessage
          message={error !== null ? error : "Product not found."}
          onRetry={handleRetry}
        />
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link to="/products">Back to products</Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div>
      <Link to="/products">&larr; Back to products</Link>

      <Row gutter={[32, 24]} style={{ marginTop: 16 }}>
        {/* Left column: the product image. */}
        <Col xs={24} md={12}>
          <img
            src={product.imageUrl || PLACEHOLDER_IMAGE}
            alt={product.name}
            onError={handleImageError}
            style={{ width: "100%", borderRadius: 12, objectFit: "cover" }}
          />
        </Col>

        {/* Right column: the details and actions. */}
        <Col xs={24} md={12}>
          <Tag color="blue">{product.category}</Tag>
          <h1 style={{ margin: "12px 0" }}>{product.name}</h1>

          <Space style={{ marginBottom: 12 }}>
            <Rate disabled allowHalf value={product.rating} />
            <span style={{ color: "#999" }}>{product.rating.toFixed(1)}</span>
          </Space>

          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            {formatCents(product.priceCents)}
          </div>

          <div style={{ marginBottom: 12 }}>
            {isOutOfStock ? (
              <Tag color="red">Out of stock</Tag>
            ) : (
              <Tag color="green">In stock: {product.stock}</Tag>
            )}
          </div>

          <p style={{ color: "#555", lineHeight: 1.6 }}>{product.description}</p>

          {quantityInCart > 0 ? (
            <div style={{ color: "#1677ff", marginBottom: 12 }}>
              In cart: {quantityInCart}
            </div>
          ) : null}

          <Space direction="vertical" style={{ width: "100%" }}>
            {/* The cart is for regular users; admins do not see "Add to cart". */}
            {!isAdmin ? (
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
            ) : null}

            {/* Admin-only actions. */}
            {isAdmin ? (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  onClick={function () {
                    navigate("/products/" + product.id + "/edit");
                  }}
                >
                  Edit
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={function () {
                    setDeleteOpen(true);
                  }}
                >
                  Delete
                </Button>
              </Space>
            ) : null}
          </Space>
        </Col>
      </Row>

      <DeleteProductModal
        open={deleteOpen}
        product={product}
        loading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={function () {
          setDeleteOpen(false);
        }}
      />
    </div>
  );
}

export default ProductDetailPage;
