// Create or edit a product with the reusable ProductForm (admin-only routes).

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { message } from "antd";
import {
  createProduct,
  getProductById,
  updateProduct,
} from "../services/productService";
import type { ProductFormValues } from "../utils/productMapper";
import {
  formValuesToProductInput,
  productToFormValues,
} from "../utils/productMapper";
import ProductForm from "../components/product/ProductForm";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

function ProductFormPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();

  // An id in the URL means edit mode; otherwise create mode.
  const isEditMode = productId !== undefined;

  // Edit mode loads the product first, so start in the loading state.
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Values used to prefill the form (undefined = blank create form).
  const [initialValues, setInitialValues] = useState<ProductFormValues | undefined>(
    undefined,
  );

  useEffect(
    function () {
      let isCurrent = true;

      async function loadProduct() {
        if (!isEditMode || productId === undefined) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const product = await getProductById(productId);
          if (isCurrent) {
            setInitialValues(productToFormValues(product));
          }
        } catch (caughtError) {
          if (isCurrent) {
            const messageText =
              caughtError instanceof Error
                ? caughtError.message
                : "Could not load the product.";
            setError(messageText);
          }
        } finally {
          if (isCurrent) {
            setLoading(false);
          }
        }
      }

      loadProduct();

      return function () {
        isCurrent = false;
      };
    },
    [isEditMode, productId],
  );

  async function handleSubmit(values: ProductFormValues) {
    // Convert form values (price in dollars) into service input (price in cents).
    const input = formValuesToProductInput(values);

    setSubmitting(true);
    try {
      if (isEditMode && productId !== undefined) {
        await updateProduct(productId, input);
        message.success("Product updated.");
        navigate("/products/" + productId);
      } else {
        await createProduct(input);
        message.success("Product created.");
        navigate("/products");
      }
    } catch (caughtError) {
      // On failure (e.g. duplicate SKU) keep the form open so input is not lost.
      const messageText =
        caughtError instanceof Error ? caughtError.message : "Save failed.";
      message.error(messageText);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading product..." />;
  }

  if (error !== null) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div>
      <h1>{isEditMode ? "Edit product" : "Add product"}</h1>
      <ProductForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        loading={submitting}
        submitText={isEditMode ? "Save changes" : "Create product"}
      />
    </div>
  );
}

export default ProductFormPage;
