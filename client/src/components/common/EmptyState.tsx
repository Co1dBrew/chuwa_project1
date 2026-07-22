// An empty-state message shown when there is nothing to display.

import type { ReactNode } from "react";
import { Empty } from "antd";

interface EmptyStateProps {
  message?: string;
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
