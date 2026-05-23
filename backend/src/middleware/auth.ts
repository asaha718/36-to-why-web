import express from "express";
import prisma from "../lib/prisma";

// Reads X-Session-Id header and validates it against the users table. Returns userId or sends 401.
export async function requireAuth(req: express.Request, res: express.Response): Promise<string | null> {
  const sessionId = req.headers["x-session-id"] as string | undefined;
  if (!sessionId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const user = await prisma.user.findUnique({ where: { id: sessionId }, select: { id: true } });
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user.id;
}
