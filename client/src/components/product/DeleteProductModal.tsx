// Controlled confirm dialog shown before a merchant deletes a product.

import { Modal } from "antd";
import type { Product } from "../../types/product";

interface DeleteProductModalProps {
  open: boolean;
  /** The product about to be deleted (null when nothing is selected). */
  product: Product | null;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteProductModal({
  open,
  product,
  loading,
  onConfirm,
  onCancel,
}: DeleteProductModalProps) {
  return (
    <Modal
      open={open}
      title="Delete product"
      okText="Delete"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
      confirmLoading={loading}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      <p>
        Are you sure you want to delete{" "}
        <strong>{product !== null ? product.name : "this product"}</strong>? This
        action cannot be undone.
      </p>
    </Modal>
  );
}

export default DeleteProductModal;
