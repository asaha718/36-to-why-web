import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { getZodiacSign } from "./utils/zodiac";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: process.env.FRONTEND_URL ?? "http://localhost:5173" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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

async function main() {
  await prisma.$connect();
  console.log("Database connected");

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
