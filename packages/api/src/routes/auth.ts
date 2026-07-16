import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { registerSchema, loginSchema } from "../validation/auth.js";
import { register, login, getUserById } from "../services/auth.service.js";
import { authMiddleware } from "../middleware/auth.js";
import { ValidationError } from "../lib/errors.js";

const userSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    name: { type: "string", nullable: true },
    createdAt: { type: "string", format: "date-time" },
  },
};

const authResponseSchema = {
  type: "object",
  properties: {
    user: userSchema,
    token: { type: "string", description: "JWT access token (15min)" },
    refreshToken: { type: "string", description: "JWT refresh token (7d)" },
  },
};

const errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string" },
        message: { type: "string" },
      },
    },
  },
};

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/register",
    {
      schema: {
        tags: ["Auth"],
        summary: "Register a new account",
        description: "Create a new user account with email and password",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
            name: { type: "string", maxLength: 255 },
          },
        },
        response: {
          201: authResponseSchema,
          409: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = registerSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());

      const user = await register(parsed.data);
      const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "15m" });
      const refreshToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });

      return reply.status(201).send({ user, token, refreshToken });
    }
  );

  app.post(
    "/login",
    {
      schema: {
        tags: ["Auth"],
        summary: "Login",
        description: "Authenticate with email and password",
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        response: {
          200: authResponseSchema,
          401: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = loginSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());

      const user = await login(parsed.data);
      const token = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "15m" });
      const refreshToken = app.jwt.sign({ sub: user.id, email: user.email }, { expiresIn: "7d" });

      return reply.send({ user, token, refreshToken });
    }
  );

  app.post(
    "/refresh",
    {
      schema: {
        tags: ["Auth"],
        summary: "Refresh tokens",
        description: "Exchange a refresh token for new access and refresh tokens",
        body: {
          type: "object",
          required: ["refreshToken"],
          properties: {
            refreshToken: { type: "string", description: "JWT refresh token" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              token: { type: "string" },
              refreshToken: { type: "string" },
            },
          },
          401: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
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
    }
  );

  app.get(
    "/me",
    {
      preHandler: [authMiddleware],
      schema: {
        tags: ["Auth"],
        summary: "Get current user",
        description: "Returns the authenticated user's profile",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: { user: userSchema },
          },
          401: errorSchema,
        },
      },
    },
    async (request: FastifyRequest) => {
      const authUser = (request as any).authUser as { id: string; email: string };
      const user = await getUserById(authUser.id);
      return { user };
    }
  );
}
