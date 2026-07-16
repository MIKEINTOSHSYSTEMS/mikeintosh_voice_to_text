import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { registerSchema, loginSchema } from "../validation/auth.js";
import { register, login, getUserById } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.js";
import { ValidationError } from "../lib/errors.js";

export async function authRoutes(app: FastifyInstance) {
  app.post("/register", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());

    const user = await register(parsed.data);
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });

    return reply.status(201).send({ user, token, refreshToken });
  });

  app.post("/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());

    const user = await login(parsed.data);
    const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });

    return reply.send({ user, token, refreshToken });
  });

  app.post("/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as { refreshToken?: string };
    if (!refreshToken) {
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "Refresh token required" },
      });
    }

    try {
      const decoded = app.jwt.verify<{ sub: string; email: string }>(refreshToken);
      const token = app.jwt.sign({ sub: decoded.sub, email: decoded.email }, { expiresIn: "15m" });
      const newRefreshToken = app.jwt.sign({ sub: decoded.sub, email: decoded.email }, { expiresIn: "7d" });

      return reply.send({ token, refreshToken: newRefreshToken });
    } catch {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Invalid or expired refresh token" },
      });
    }
  });

  app.get("/me", { preHandler: [authMiddleware] }, async (request: FastifyRequest) => {
    const authUser = (request as any).authUser as { id: string; email: string };
    const user = await getUserById(authUser.id);
    return { user };
  });
}
