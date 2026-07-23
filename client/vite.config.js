import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite build configuration.
// See https://vite.dev/config/ for all available options.
export default defineConfig({
  // The React plugin adds support for JSX/TSX and fast refresh during development.
  plugins: [react()],
  server: {
    // The port the development server runs on.
    // If an environment variable named PORT is provided, use it; otherwise use 5173.
    port: Number(process.env.PORT) || 5173,

    // The backend has no CORS headers, so we cannot call http://localhost:3000
    // directly from the browser. Instead the frontend calls same-origin "/api/..."
    // paths, and Vite proxies them to the backend, stripping the "/api" prefix.
    // Example: "/api/products" -> "http://localhost:3000/products".
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
