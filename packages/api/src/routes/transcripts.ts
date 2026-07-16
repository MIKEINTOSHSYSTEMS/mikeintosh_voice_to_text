import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import {
  createTranscriptSchema,
  updateTranscriptSchema,
  listTranscriptsQuerySchema,
} from "../validation/transcript.js";
import * as transcriptService from "../services/transcript.service.js";
import { ValidationError } from "../lib/errors.js";

const transcriptSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    userId: { type: "string", format: "uuid" },
    title: { type: "string", nullable: true },
    content: { type: "string", nullable: true },
    duration: { type: "integer" },
    wordCount: { type: "integer" },
    charCount: { type: "integer" },
    language: { type: "string" },
    source: { type: "string", enum: ["microphone", "upload"] },
    metadata: { type: "object" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
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

export async function transcriptRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get(
    "/",
    {
      schema: {
        tags: ["Transcripts"],
        summary: "List transcripts",
        description: "Get paginated list of transcripts for the authenticated user",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
            search: { type: "string", description: "Search in title and content" },
            sort: { type: "string", enum: ["createdAt", "updatedAt"], default: "updatedAt" },
            order: { type: "string", enum: ["asc", "desc"], default: "desc" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              transcripts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string", nullable: true },
                    duration: { type: "integer" },
                    wordCount: { type: "integer" },
                    charCount: { type: "integer" },
                    language: { type: "string" },
                    source: { type: "string" },
                    createdAt: { type: "string" },
                    updatedAt: { type: "string" },
                  },
                },
              },
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
      const parsed = listTranscriptsQuerySchema.safeParse(request.query);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());

      const authUser = (request as any).authUser as { id: string };
      const result = await transcriptService.listTranscripts(authUser.id, parsed.data);
      return reply.send(result);
    }
  );

  app.post(
    "/",
    {
      schema: {
        tags: ["Transcripts"],
        summary: "Create transcript",
        description: "Create a new transcript",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 500 },
            content: { type: "string" },
            duration: { type: "integer", minimum: 0, default: 0 },
            wordCount: { type: "integer", minimum: 0, default: 0 },
            charCount: { type: "integer", minimum: 0, default: 0 },
            language: { type: "string", default: "am-ET" },
            source: { type: "string", enum: ["microphone", "upload"], default: "microphone" },
            metadata: { type: "object", default: {} },
          },
        },
        response: {
          201: {
            type: "object",
            properties: { transcript: transcriptSchema },
          },
          401: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = createTranscriptSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());

      const authUser = (request as any).authUser as { id: string };
      const transcript = await transcriptService.createTranscript(authUser.id, parsed.data);
      return reply.status(201).send({ transcript });
    }
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Transcripts"],
        summary: "Get transcript",
        description: "Get a single transcript by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { transcript: transcriptSchema },
          },
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const authUser = (request as any).authUser as { id: string };
      const transcript = await transcriptService.getTranscript(authUser.id, id);
      return reply.send({ transcript });
    }
  );

  app.put(
    "/:id",
    {
      schema: {
        tags: ["Transcripts"],
        summary: "Update transcript",
        description: "Update an existing transcript",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        body: {
          type: "object",
          properties: {
            title: { type: "string", maxLength: 500 },
            content: { type: "string" },
            duration: { type: "integer", minimum: 0 },
            wordCount: { type: "integer", minimum: 0 },
            charCount: { type: "integer", minimum: 0 },
            language: { type: "string" },
            source: { type: "string", enum: ["microphone", "upload"] },
            metadata: { type: "object" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: { transcript: transcriptSchema },
          },
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const parsed = updateTranscriptSchema.safeParse(request.body);
      if (!parsed.success) throw new ValidationError(parsed.error.flatten());

      const authUser = (request as any).authUser as { id: string };
      const transcript = await transcriptService.updateTranscript(authUser.id, id, parsed.data);
      return reply.send({ transcript });
    }
  );

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Transcripts"],
        summary: "Delete transcript",
        description: "Delete a transcript by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
        response: {
          204: { description: "Transcript deleted" },
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const authUser = (request as any).authUser as { id: string };
      await transcriptService.deleteTranscript(authUser.id, id);
      return reply.status(204).send();
    }
  );
}
