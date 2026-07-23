// Shared form for both creating and editing a product.
// Price/stock are validated (not clamped) so negative input shows an error.

import { useEffect, useState } from "react";
import { Button, Form, Input, InputNumber, Select, Upload, message } from "antd";
import type { UploadFile } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import type { ProductFormValues } from "../../utils/productMapper";
import { getCategories } from "../../services/categoryService";
import { isNonNegativeNumber } from "../../utils/validation";

// The raw values AntD collects. Same as ProductFormValues, except the photo
// arrives from the Upload component as a file list under "image".
interface RawProductFormValues {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sku: string;
  image?: UploadFile[];
}

// AntD passes either an array or an event object; normalize to a file list.
function normalizeUploadEvent(event: unknown): UploadFile[] {
  if (Array.isArray(event)) {
    return event;
  }
  const withFileList = event as { fileList?: UploadFile[] };
  return withFileList.fileList ?? [];
}

// Validate the chosen image and stop AntD from auto-uploading it (we upload it
// ourselves when the form is submitted).
function beforeImageUpload(file: File) {
  const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    message.error("Only JPG, PNG or WebP images are allowed.");
    return Upload.LIST_IGNORE;
  }
  if (file.size > 5 * 1024 * 1024) {
    message.error("Image must be 5 MB or smaller.");
    return Upload.LIST_IGNORE;
  }
  return false;
}

interface ProductFormProps {
  /** Values to prefill (edit mode). Leave undefined for a blank create form. */
  initialValues?: ProductFormValues;
  /** The product's existing photo URL, shown in edit mode. */
  currentImageUrl?: string;
  onSubmit: (values: ProductFormValues) => void;
  loading: boolean;
  submitText: string;
}

function ProductForm({
  initialValues,
  currentImageUrl,
  onSubmit,
  loading,
  submitText,
}: ProductFormProps) {
  // Edit mode prefills values; create mode starts blank.
  const isEditMode = initialValues !== undefined;
  // Category choices for the dropdown, loaded once from the backend.
  const [categoryOptions, setCategoryOptions] = useState<
    { label: string; value: string }[]
  >([]);

  useEffect(function () {
    getCategories()
      .then(function (categories) {
        setCategoryOptions(
          categories.map(function (category) {
            return { label: category.name, value: category.name };
          }),
        );
      })
      .catch(function () {
        // If categories fail to load, the dropdown just stays empty.
      });
  }, []);

  function handleFinish(values: RawProductFormValues) {
    // Pull the actual File out of the Upload component's file list (if any).
    const fileList = values.image ?? [];
    const imageFile =
      fileList.length > 0 ? (fileList[0].originFileObj ?? null) : null;

    onSubmit({
      name: values.name,
      description: values.description,
      price: values.price,
      stock: values.stock,
      category: values.category,
      sku: values.sku,
      imageFile: imageFile,
    });
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
        label="Photo"
        name="image"
        valuePropName="fileList"
        getValueFromEvent={normalizeUploadEvent}
        extra={
          isEditMode
            ? "Optional. Leave empty to keep the current photo."
            : "Optional. JPG, PNG or WebP, up to 5 MB."
        }
      >
        <Upload
          beforeUpload={beforeImageUpload}
          maxCount={1}
          listType="picture"
          accept="image/png,image/jpeg,image/webp"
        >
          <Button icon={<UploadOutlined />}>Select photo</Button>
        </Upload>
      </Form.Item>

      {isEditMode && currentImageUrl ? (
        <Form.Item label="Current photo">
          <img
            src={currentImageUrl}
            alt="Current product"
            style={{ maxWidth: 160, borderRadius: 8 }}
          />
        </Form.Item>
      ) : null}

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
