import { Router } from "express";

const router = Router();

// Health check — used to verify the server is up.
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;
