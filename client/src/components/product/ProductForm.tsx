// Shared form for both creating and editing a product.
// Price/stock are validated (not clamped) so negative input shows an error.

import { Button, Form, Input, InputNumber, Select } from "antd";
import type { ProductFormValues } from "../../utils/productMapper";
import { PRODUCT_CATEGORIES } from "../../mocks/products";
import { isNonNegativeNumber } from "../../utils/validation";

interface ProductFormProps {
  /** Values to prefill (edit mode). Leave undefined for a blank create form. */
  initialValues?: ProductFormValues;
  onSubmit: (values: ProductFormValues) => void;
  loading: boolean;
  submitText: string;
}

function ProductForm({
  initialValues,
  onSubmit,
  loading,
  submitText,
}: ProductFormProps) {
  const categoryOptions = PRODUCT_CATEGORIES.map(function (category) {
    return { label: category, value: category };
  });

  function handleFinish(values: ProductFormValues) {
    onSubmit(values);
  }

  return (
    <Form
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
      style={{ maxWidth: 640 }}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: "Please enter a product name." }]}
      >
        <Input placeholder="e.g. Wireless Headphones" />
      </Form.Item>

      <Form.Item
        label="Description"
        name="description"
        rules={[{ required: true, message: "Please enter a description." }]}
      >
        <Input.TextArea rows={3} placeholder="Describe the product" />
      </Form.Item>

      <Form.Item
        label="Price (USD)"
        name="price"
        rules={[
          { required: true, message: "Please enter a price." },
          {
            validator(_rule, value) {
              // Let the "required" rule handle empty values.
              if (value === null || value === undefined) {
                return Promise.resolve();
              }
              if (isNonNegativeNumber(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Price cannot be negative."));
            },
          },
        ]}
      >
        <InputNumber
          prefix="$"
          step={0.01}
          precision={2}
          style={{ width: "100%" }}
          placeholder="12.99"
        />
      </Form.Item>

      <Form.Item
        label="Stock"
        name="stock"
        rules={[
          { required: true, message: "Please enter the stock quantity." },
          {
            validator(_rule, value) {
              // Let the "required" rule handle empty values.
              if (value === null || value === undefined) {
                return Promise.resolve();
              }
              if (isNonNegativeNumber(value)) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("Stock cannot be negative."));
            },
          },
        ]}
      >
        <InputNumber step={1} precision={0} style={{ width: "100%" }} placeholder="10" />
      </Form.Item>

      <Form.Item
        label="Rating (0 to 5)"
        name="rating"
        rules={[{ required: true, message: "Please enter a rating." }]}
      >
        <InputNumber min={0} max={5} step={0.1} style={{ width: "100%" }} placeholder="4.5" />
      </Form.Item>

      <Form.Item
        label="Image URL"
        name="imageUrl"
        rules={[{ required: true, message: "Please enter an image URL." }]}
      >
        <Input placeholder="https://..." />
      </Form.Item>

      <Form.Item
        label="Category"
        name="category"
        rules={[{ required: true, message: "Please choose a category." }]}
      >
        <Select options={categoryOptions} placeholder="Choose a category" />
      </Form.Item>

      <Form.Item
        label="SKU"
        name="sku"
        rules={[{ required: true, message: "Please enter a SKU (unique code)." }]}
      >
        <Input placeholder="e.g. ELEC-001" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {submitText}
        </Button>
      </Form.Item>
    </Form>
  );
}

export default ProductForm;
