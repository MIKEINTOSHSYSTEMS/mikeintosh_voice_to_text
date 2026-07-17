import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { subscribeToJobProgress } from "../services/pubsub.service.js";

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

const jobSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    type: { type: "string" },
    status: { type: "string" },
    progress: { type: "integer" },
    result: { type: "object" },
    error: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
    startedAt: { type: "string", format: "date-time", nullable: true },
    completedAt: { type: "string", format: "date-time", nullable: true },
  },
};

export async function jobRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get(
    "/",
    {
      schema: {
        tags: ["Jobs"],
        summary: "List jobs",
        description: "Get paginated list of jobs for the authenticated user",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            status: { type: "string", enum: ["pending", "queued", "active", "completed", "failed"] },
            type: { type: "string", enum: ["transcription", "summarize", "translate", "analyze"] },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              jobs: { type: "array", items: jobSchema },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer" },
                  limit: { type: "integer" },
                  total: { type: "integer" },
                  totalPages: { type: "integer" },
                },
              },
            },
          },
          401: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { page = 1, limit = 20, status, type } = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        type?: string;
      };

      const where: any = { userId: authUser.id };
      if (status) where.status = status;
      if (type) where.type = type;

      const skip = (page - 1) * limit;
      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.job.count({ where }),
      ]);

      return reply.send({
        jobs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Jobs"],
        summary: "Get job",
        description: "Get job details by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { job: jobSchema },
          },
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { id } = request.params as { id: string };

      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Job not found" } });
      if (job.userId !== authUser.id) {
        return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Access denied" } });
      }

      return reply.send({ job });
    }
  );

  app.get(
    "/:id/stream",
    {
      schema: {
        tags: ["Jobs"],
        summary: "Stream job progress",
        description: "SSE stream for real-time job progress updates. Accepts JWT token via query parameter for EventSource compatibility.",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        querystring: {
          type: "object",
          properties: {
            token: { type: "string", description: "JWT access token (required for SSE since EventSource cannot set headers)" },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { id } = request.params as { id: string };

      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Job not found" } });
      }
      if (job.userId !== authUser.id) {
        return reply.status(403).send({ error: { code: "FORBIDDEN", message: "Access denied" } });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });

      const sendEvent = (data: Record<string, unknown>) => {
        reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      sendEvent({
        type: "snapshot",
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      });

      if (job.status === "completed") {
        sendEvent({ type: "done", status: "completed", progress: 100 });
        reply.raw.end();
        return;
      }

      if (job.status === "failed") {
        sendEvent({ type: "done", status: "failed", progress: job.progress, error: job.error });
        reply.raw.end();
        return;
      }

      const unsubscribe = subscribeToJobProgress(id, (event) => {
        sendEvent(event as unknown as Record<string, unknown>);
        if (event.status === "completed" || event.status === "failed") {
          setTimeout(() => {
            unsubscribe();
            reply.raw.end();
          }, 100);
        }
      });

      request.raw.on("close", () => {
        unsubscribe();
      });

      const keepAlive = setInterval(() => {
        reply.raw.write(`:keepalive\n\n`);
      }, 15000);

      request.raw.on("close", () => {
        clearInterval(keepAlive);
      });
    }
  );
}
