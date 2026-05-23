import { Router } from "express";
import crypto from "crypto";
import { Server as SocketServer } from "socket.io";
import prisma from "../lib/prisma";
import { requireAuth } from "../middleware/auth";

export function createPartnersRouter(io: SocketServer): Router {
  const router = Router();

  // Generates a one-time 6-character invite code the user can share to link a partner.
  router.post("/api/partner/invite", async (req, res) => {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    try {
      const link = await prisma.partnerLink.create({
        data: { inviteCode, userIdA: userId },
      });
      res.status(201).json({ inviteCode: link.inviteCode, id: link.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Accepts an invite code, links the caller as the second partner, and notifies the inviter via Socket.io.
  router.post("/api/partner/link", async (req, res) => {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    const { inviteCode } = req.body as { inviteCode?: string };
    if (!inviteCode) {
      res.status(400).json({ error: "inviteCode is required." });
      return;
    }

    try {
      const link = await prisma.partnerLink.findUnique({ where: { inviteCode } });

      if (!link) {
        res.status(404).json({ error: "Invalid invite code." });
        return;
      }
      if (link.userIdB !== null) {
        res.status(409).json({ error: "This invite code has already been used." });
        return;
      }
      if (link.userIdA === userId) {
        res.status(400).json({ error: "You cannot link with yourself." });
        return;
      }

      const caller = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      const updated = await prisma.partnerLink.update({
        where: { inviteCode },
        data: { userIdB: userId, linkedAt: new Date() },
      });

      io.to(link.userIdA).emit("partnerLinked", {
        partnerName: caller?.name ?? "Someone",
        inviteCode,
      });

      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Returns all active partner connections (both directions) for the authenticated user.
  router.get("/api/partner/links", async (req, res) => {
    const userId = await requireAuth(req, res);
    if (!userId) return;

    try {
      const links = await prisma.partnerLink.findMany({
        where: {
          OR: [{ userIdA: userId }, { userIdB: userId }],
          linkedAt: { not: null },
        },
        include: {
          userA: { select: { id: true, name: true } },
          userB: { select: { id: true, name: true } },
        },
        orderBy: { linkedAt: "desc" },
      });

      const result = links.map((l) => {
        const partner = l.userIdA === userId ? l.userB : l.userA;
        return {
          id: l.id,
          inviteCode: l.inviteCode,
          linkedAt: l.linkedAt,
          partner: partner ? { id: partner.id, name: partner.name } : null,
        };
      });

      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Returns partner's answers visible to the caller — only questions both have answered.
  router.get("/api/partner/:partnerId/answers", async (req, res) => {
    const callerId = await requireAuth(req, res);
    if (!callerId) return;

    const { partnerId } = req.params;

    try {
      const link = await prisma.partnerLink.findFirst({
        where: {
          OR: [
            { userIdA: callerId, userIdB: partnerId },
            { userIdA: partnerId, userIdB: callerId },
          ],
          linkedAt: { not: null },
        },
      });
      if (!link) {
        res.status(403).json({ error: "Not linked with this partner." });
        return;
      }

      const partnerUser = await prisma.user.findUnique({
        where: { id: partnerId },
        select: { name: true },
      });
      if (!partnerUser) {
        res.status(404).json({ error: "Partner not found." });
        return;
      }

      const [partnerAnswers, myAnswers] = await Promise.all([
        prisma.answer.findMany({
          where: { userId: partnerId },
          include: { question: true },
          orderBy: [{ question: { set: "asc" } }, { question: { id: "asc" } }],
        }),
        prisma.answer.findMany({
          where: { userId: callerId },
          select: { questionId: true },
        }),
      ]);

      const myAnsweredSet = new Set(myAnswers.map((a) => a.questionId));
      const visibleAnswers = partnerAnswers.filter((a) => myAnsweredSet.has(a.questionId));
      const lockedCount = partnerAnswers.length - visibleAnswers.length;

      res.json({
        partnerName: partnerUser.name,
        partnerTotalAnswered: partnerAnswers.length,
        myTotalAnswered: myAnswers.length,
        lockedCount,
        answers: visibleAnswers.map((a) => ({
          questionId: a.questionId,
          text: a.text,
          question: { id: a.question.id, set: a.question.set, text: a.question.text },
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}
