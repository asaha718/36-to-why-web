import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";
import { Server as SocketServer } from "socket.io";
import { getZodiacSign } from "./utils/zodiac";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Each socket joins a room named by its sessionId so we can emit to a specific user later.
io.on("connection", (socket) => {
  const sessionId = socket.handshake.query["sessionId"] as string | undefined;
  if (sessionId) socket.join(sessionId);
});

// Reads X-Session-Id header and validates it against the users table. Returns userId or sends 401.
async function requireAuth(req: express.Request, res: express.Response): Promise<string | null> {
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

// Health check — used to verify the server is up.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Returns all 36 questions ordered by set then id.
app.get("/api/questions", async (_req, res) => {
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

// Creates a new user account, calculates their zodiac sign, and returns a session.
app.post("/api/profile", async (req, res) => {
  const { name, username, email, password, dateOfBirth, relationshipType } = req.body;

  if (!name || !email || !password || !dateOfBirth || !relationshipType) {
    res.status(400).json({ error: "Missing required fields." });
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with that email already exists." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const dob = new Date(dateOfBirth);
  const zodiacSign = getZodiacSign(dob);

  const user = await prisma.user.create({
    data: {
      name,
      username: username || null,
      email,
      passwordHash,
      dateOfBirth: dob,
      zodiacSign,
      relationshipType,
    },
    select: { id: true, name: true, email: true, username: true, zodiacSign: true, relationshipType: true },
  });

  res.status(201).json({ sessionId: user.id, user });
});

// Validates email + password and returns a session if credentials are correct.
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password." });
    return;
  }

  const { passwordHash: _omit, ...safeUser } = user;
  res.json({ sessionId: user.id, user: safeUser });
});

// Returns all answers the authenticated user has submitted.
app.get("/api/answers", async (req, res) => {
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
app.post("/api/answers", async (req, res) => {
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

// Generates a one-time 6-character invite code the user can share to link a partner.
app.post("/api/partner/invite", async (req, res) => {
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
app.post("/api/partner/link", async (req, res) => {
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
app.get("/api/partner/links", async (req, res) => {
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

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  server.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
