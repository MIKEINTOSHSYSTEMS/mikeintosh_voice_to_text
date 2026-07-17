import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

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
}
