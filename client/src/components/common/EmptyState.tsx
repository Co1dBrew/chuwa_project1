/*
 * A friendly "there is nothing here" message. Used, for example, when a search
 * returns no products, or when the shopping cart is empty.
 */

import type { ReactNode } from "react";
import { Empty } from "antd";

interface EmptyStateProps {
  /** The message describing what is empty. */
  message?: string;
  /** Optional extra content, such as a button, shown under the message. */
  children?: ReactNode;
}

function EmptyState({ message = "Nothing to show here yet.", children }: EmptyStateProps) {
  return (
    <div style={{ padding: 48 }}>
      <Empty description={message}>{children}</Empty>
    </div>
  );
}

export default EmptyState;
