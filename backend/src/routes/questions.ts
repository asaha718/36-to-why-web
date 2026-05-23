import { Router } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Returns all 36 questions ordered by set then id.
router.get("/api/questions", async (_req, res) => {
  try {
    const questions = await prisma.question.findMany({
      orderBy: [{ set: "asc" }, { id: "asc" }],
    });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
