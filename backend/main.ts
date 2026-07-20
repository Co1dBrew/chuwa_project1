import "dotenv/config";
import express from "express";
import { closeDatabase } from "./db.js";
import categoriesRouter from "./routers/categories.router.js";
import productsRouter from "./routers/products.router.js";
import usersRouter from "./routers/users.router.js";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use("/products", productsRouter);
app.use("/categories", categoriesRouter);
app.use("/users", usersRouter);

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
