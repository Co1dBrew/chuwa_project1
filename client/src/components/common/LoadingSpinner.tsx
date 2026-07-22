/*
 * A centered loading spinner shown while we wait for data (for example while the
 * product service is "fetching" products).
 */

import { Spin } from "antd";

interface LoadingSpinnerProps {
  /** Optional text shown under the spinner. */
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
