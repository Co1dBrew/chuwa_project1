/*
 * ErrorBoundary catches unexpected errors that happen while React is rendering
 * the app, and shows a friendly fallback screen instead of a blank white page.
 *
 * IMPORTANT: an error boundary MUST be written as a class component. This is the
 * only feature in React that function components cannot do, because it relies on
 * two special lifecycle methods (getDerivedStateFromError and componentDidCatch)
 * that only exist on classes. That is why this file looks different from the
 * others.
 *
 * We place it at the very top of the app (in main.tsx) so it can catch errors
 * from anywhere inside.
 */

import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button, Result } from "antd";

/** The props: an error boundary simply wraps whatever children we give it. */
interface ErrorBoundaryProps {
  children: ReactNode;
}

/** The internal state: are we currently showing an error, and which one. */
interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Start with no error.
    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  /**
   * React calls this automatically when a child throws during rendering.
   * Whatever object we return here is merged into the state, which lets us flip
   * into the "show the error screen" mode.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  /**
   * React also calls this after an error. It is the right place to log the
   * error (in a real app you might send it to a monitoring service).
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    // If an error happened, show the fallback screen with a reload button.
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Something went wrong"
          subTitle={this.state.errorMessage || "An unexpected error occurred."}
          extra={
            <Button
              type="primary"
              onClick={function () {
                window.location.reload();
              }}
            >
              Reload the page
            </Button>
          }
        />
      );
    }

    // Otherwise, render the app exactly as normal.
    return this.props.children;
  }
}

export default ErrorBoundary;
