import { Router } from "express";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Returns all answers the authenticated user has submitted.
router.get("/api/answers", async (req, res) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  try {
    const answers = await prisma.answer.findMany({
      where: { userId },
      select: { questionId: true, text: true, submittedAt: true },
    });
    res.json(answers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Creates or updates the authenticated user's answer for a given question (upsert).
router.post("/api/answers", async (req, res) => {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  const { questionId, text } = req.body;
  if (!questionId || typeof text !== "string") {
    res.status(400).json({ error: "questionId and text are required." });
    return;
  }

  try {
    const answer = await prisma.answer.upsert({
      where: { userId_questionId: { userId, questionId } },
      update: { text, submittedAt: new Date() },
      create: { userId, questionId, text, submittedAt: new Date() },
    });
    res.status(201).json(answer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
