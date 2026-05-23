import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import prisma from "./lib/prisma";
import healthRouter from "./routes/health";
import questionsRouter from "./routes/questions";
import authRouter from "./routes/auth";
import answersRouter from "./routes/answers";
import { createPartnersRouter } from "./routes/partners";

const app = express();
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

app.use(healthRouter);
app.use(questionsRouter);
app.use(authRouter);
app.use(answersRouter);
app.use(createPartnersRouter(io));

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
