/*
 * A reusable error panel with an optional "Try again" button.
 *
 * We show this when a request fails (for example the product list could not be
 * loaded). The onRetry callback lets the parent page attempt the request again.
 */

import { Button, Result } from "antd";

interface ErrorMessageProps {
  /** The error text to display. */
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
        // Only render the button if the parent gave us an onRetry function.
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
