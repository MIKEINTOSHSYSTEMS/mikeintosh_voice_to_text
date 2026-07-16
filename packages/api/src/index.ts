import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { loadConfig } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { authRoutes } from "./routes/auth.js";
import { transcriptRoutes } from "./routes/transcripts.js";
import { healthRoutes } from "./routes/health.js";
import type { AppError } from "./lib/errors.js";

const env = loadConfig();

const app = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
});

await app.register(cors, {
  origin: env.CORS_ORIGIN,
  credentials: true,
});

await app.register(jwt, {
  secret: env.JWT_SECRET,
  sign: { expiresIn: env.JWT_ACCESS_EXPIRY },
});

await app.register(healthRoutes);
await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(transcriptRoutes, { prefix: "/api/transcripts" });

app.setErrorHandler((error: AppError & { statusCode?: number; code?: string; details?: unknown }, _request, reply) => {
  const statusCode = error.statusCode || 500;
  const code = error.code || "INTERNAL_ERROR";
  const message = statusCode === 500 ? "Internal server error" : error.message;
  const details = error.details || undefined;

  app.log.error(error);
  reply.status(statusCode).send({ error: { code, message, details } });
});

const shutdown = async () => {
  await prisma.$disconnect();
  await app.close();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  await app.listen({ port: env.PORT, host: env.HOST });
  app.log.info(`VoiceText API running on http://${env.HOST}:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  await shutdown();
  process.exit(1);
}
