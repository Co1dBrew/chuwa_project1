// A centered loading spinner shown while waiting for data.

import { Spin } from "antd";

interface LoadingSpinnerProps {
  message?: string;
}

function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 48,
      }}
    >
      <Spin size="large" />
      <span style={{ color: "#888" }}>{message}</span>
    </div>
  );
}

export default LoadingSpinner;
