import { Router } from "express";
import { getCategories } from "../db.js";

const router = Router();

router.get("/", async (_, res) => {
  res.json(await getCategories());
});

export default router;
