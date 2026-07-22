/*
 * main.tsx is the entry point: the very first file that runs in the browser.
 *
 * It finds the <div id="root"> in index.html and renders our React app into it.
 * The whole app is wrapped in <ErrorBoundary> so that if any component throws an
 * unexpected error while rendering, the user sees a friendly message instead of
 * a blank page.
 */

// This small patch lets Ant Design's message/notification/Modal work correctly
// with React 19. It must be imported once, at the very top.
import "@ant-design/v5-patch-for-react-19";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Find the element in index.html where the app will be attached.
const rootElement = document.getElementById("root");

// This should never happen, but if the element is missing we fail loudly.
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
