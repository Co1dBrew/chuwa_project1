/*
 * ProductFormPage handles BOTH creating a new product and editing an existing
 * one, using the single reusable ProductForm component.
 *
 * How it decides the mode:
 *   - If the URL has a productId (/products/:productId/edit) -> EDIT mode.
 *     It loads the product and prefills the form.
 *   - If there is no productId (/products/new) -> CREATE mode.
 *     The form starts blank.
 *
 * After a successful save it navigates away so the change is visible:
 *   - after create -> go to the product list (the new product appears there)
 *   - after edit   -> go to that product's detail page (shows the new info)
 *
 * This page is only reachable by admins, because its routes are wrapped in
 * AdminRoute.
 */

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

  // If there is an id in the URL we are editing; otherwise we are creating.
  const isEditMode = productId !== undefined;

  // In edit mode we must load the product first, so start in the loading state.
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The values used to prefill the form (undefined = blank create form).
  const [initialValues, setInitialValues] = useState<ProductFormValues | undefined>(
    undefined,
  );

  // In edit mode, load the existing product and turn it into form values.
  useEffect(
    function () {
      let isCurrent = true;

      async function loadProduct() {
        // In create mode there is nothing to load.
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

  // Called by ProductForm when the user submits valid values.
  async function handleSubmit(values: ProductFormValues) {
    // Convert the form values (price in dollars) into the data the service
    // expects (price in cents).
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
        // Go to the list, where the newly created product now appears at the top.
        navigate("/products");
      }
    } catch (caughtError) {
      // For example a duplicate SKU. Show the message and keep the form open so
      // the user does not lose what they typed.
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
