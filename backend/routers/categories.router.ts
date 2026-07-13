import { Router } from "express";
import { getCategories } from "../db.js";

const router = Router();

router.get("/", async (_, res) => {
  try {
    res.json(await getCategories());
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to fetch categories",
    });
  }
});

export default router;
