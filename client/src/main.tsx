// App entry point: renders React into #root, wrapped in an error boundary.

// Ant Design patch for React 19; must be imported once, at the top.
import "@ant-design/v5-patch-for-react-19";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error('Could not find an element with id "root" to render into.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
