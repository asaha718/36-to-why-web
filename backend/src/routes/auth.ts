import { Router } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { getZodiacSign } from "../utils/zodiac";

const router = Router();

// Creates a new user account, calculates their zodiac sign, and returns a session.
router.post("/api/profile", async (req, res) => {
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
router.post("/api/auth/login", async (req, res) => {
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

export default router;
