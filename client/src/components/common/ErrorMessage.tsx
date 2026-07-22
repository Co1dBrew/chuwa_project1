// A reusable error panel with an optional "Try again" button.

import { Button, Result } from "antd";

interface ErrorMessageProps {
  message?: string;
  /** If provided, a "Try again" button is shown that calls this function. */
  onRetry?: () => void;
}

function ErrorMessage({
  message = "Something went wrong. Please try again.",
  onRetry,
}: ErrorMessageProps) {
  return (
    <Result
      status="error"
      title="Request failed"
      subTitle={message}
      extra={
        onRetry ? (
          <Button type="primary" onClick={onRetry}>
            Try again
          </Button>
        ) : null
      }
    />
  );
}

export default ErrorMessage;
