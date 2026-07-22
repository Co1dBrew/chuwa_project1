/*
 * DeleteProductModal asks the admin to confirm before a product is deleted.
 *
 * It is a "controlled" dialog: the parent decides whether it is open and which
 * product it refers to, and reacts to the confirm/cancel buttons. Keeping the
 * real delete logic in the parent lets the parent also refresh the list and fix
 * the page number afterwards.
 */

import { Modal } from "antd";
import type { Product } from "../../types/product";

interface DeleteProductModalProps {
  /** Whether the dialog is currently visible. */
  open: boolean;
  /** The product about to be deleted (null when nothing is selected). */
  product: Product | null;
  /** true while the delete request is running. */
  loading: boolean;
  /** Called when the admin confirms the deletion. */
  onConfirm: () => void;
  /** Called when the admin cancels. */
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
