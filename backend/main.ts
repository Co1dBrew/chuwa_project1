import "dotenv/config";
import express from "express";
import { closeDatabase } from "./db.js";
import categoriesRouter from "./routers/categories.router.js";
import productsRouter from "./routers/products.router.js";
import usersRouter from "./routers/users.router.js";
import { AppError, errorHandler, notFoundHandler } from "./error.js";

const app = express();
const PORT = 3000;
const jsonParser = express.json();

function toJsonParserError(error: unknown): AppError | undefined {
  if (typeof error !== "object" || error === null || !("type" in error)) {
    return undefined;
  }

  if (error.type === "entity.parse.failed") {
    return new AppError(
      400,
      "INVALID_JSON",
      "Request body must contain valid JSON",
    );
  }

  if (error.type === "entity.too.large") {
    return new AppError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  }

  return undefined;
}

app.use((req, res, next) => {
  jsonParser(req, res, (error) => {
    next(toJsonParserError(error) ?? error);
  });
});
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

let shuttingDown = false;

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received`);

  server.close(async (error) => {
    try {
      if (error) throw error;

      await closeDatabase();

      console.log("HTTP server and PostgreSQL pool closed");
      process.exit(0);
    } catch (error) {
      console.error("Shutdown failed:", error);
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
