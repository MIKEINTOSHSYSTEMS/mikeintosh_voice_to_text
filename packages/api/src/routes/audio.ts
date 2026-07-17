import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import * as audioService from "../services/audio.service.js";
import { ValidationError } from "../lib/errors.js";
import { getConfig } from "../config.js";

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

const audioSchema = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    filename: { type: "string" },
    mimeType: { type: "string" },
    size: { type: "integer" },
    duration: { type: "integer" },
    status: { type: "string" },
    language: { type: "string" },
    createdAt: { type: "string", format: "date-time" },
  },
};

export async function audioRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.post(
    "/upload",
    {
      schema: {
        tags: ["Audio"],
        summary: "Upload audio file",
        description: "Upload an audio file for transcription",
        security: [{ bearerAuth: [] }],
        response: {
          201: {
            type: "object",
            properties: { audio: audioSchema },
          },
          401: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const config = getConfig();

      const data = await request.file();
      if (!data) throw new ValidationError({ formErrors: ["No file uploaded"] });

      const allowedTypes = config.ALLOWED_AUDIO_TYPES.split(",");
      if (!allowedTypes.includes(data.mimetype)) {
        throw new ValidationError({ formErrors: [`Invalid file type. Allowed: ${allowedTypes.join(", ")}`] });
      }

      const maxSize = config.MAX_UPLOAD_SIZE_MB * 1024 * 1024;
      const buffer = await data.toBuffer();
      if (buffer.length > maxSize) {
        throw new ValidationError({ formErrors: [`File too large. Max: ${config.MAX_UPLOAD_SIZE_MB}MB`] });
      }

      const audio = await audioService.createAudio(authUser.id, {
        filename: data.filename,
        mimeType: data.mimetype,
        size: buffer.length,
        buffer,
      });

      return reply.status(201).send({ audio });
    }
  );

  app.get(
    "/",
    {
      schema: {
        tags: ["Audio"],
        summary: "List audio files",
        description: "Get paginated list of audio files",
        security: [{ bearerAuth: [] }],
        querystring: {
          type: "object",
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              audioFiles: { type: "array", items: audioSchema },
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
      const { page, limit } = request.query as { page?: number; limit?: number };
      const result = await audioService.listAudio(authUser.id, { page, limit });
      return reply.send(result);
    }
  );

  app.get(
    "/:id",
    {
      schema: {
        tags: ["Audio"],
        summary: "Get audio file",
        description: "Get audio file metadata by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: { audio: audioSchema },
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
      const audio = await audioService.getAudio(authUser.id, id);
      return reply.send({ audio });
    }
  );

  app.delete(
    "/:id",
    {
      schema: {
        tags: ["Audio"],
        summary: "Delete audio file",
        description: "Delete an audio file by ID",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          204: { description: "Audio deleted" },
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { id } = request.params as { id: string };
      await audioService.deleteAudioFile(authUser.id, id);
      return reply.status(204).send();
    }
  );

  app.post(
    "/:id/transcribe",
    {
      schema: {
        tags: ["Audio"],
        summary: "Start transcription",
        description: "Start a transcription job for an audio file",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          202: {
            type: "object",
            properties: {
              jobId: { type: "string" },
              audioId: { type: "string" },
            },
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
      const result = await audioService.startTranscription(authUser.id, id);
      return reply.status(202).send(result);
    }
  );

  app.get(
    "/:id/status",
    {
      schema: {
        tags: ["Audio"],
        summary: "Get transcription status",
        description: "Check transcription status for an audio file",
        security: [{ bearerAuth: [] }],
        params: {
          type: "object",
          required: ["id"],
          properties: { id: { type: "string", format: "uuid" } },
        },
        response: {
          200: {
            type: "object",
            properties: {
              audio: audioSchema,
              jobs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    type: { type: "string" },
                    status: { type: "string" },
                    progress: { type: "integer" },
                    createdAt: { type: "string" },
                  },
                },
              },
            },
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
      const result = await audioService.getAudioStatus(authUser.id, id);
      return reply.send(result);
    }
  );
}
