import type { FastifyInstance } from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import * as aiService from "../services/ai.service.js";
import { ValidationError } from "../lib/errors.js";

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

export async function aiRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.post(
    "/summarize",
    {
      schema: {
        tags: ["AI"],
        summary: "Summarize transcript",
        description: "Generate a summary of a transcript using AI",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["transcriptId"],
          properties: {
            transcriptId: { type: "string", format: "uuid" },
            maxLength: { type: "integer", minimum: 100, maximum: 5000 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              summary: { type: "string" },
              keyPoints: { type: "array", items: { type: "string" } },
              wordCount: { type: "integer" },
            },
          },
          401: errorSchema,
          404: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { transcriptId, maxLength } = request.body as { transcriptId: string; maxLength?: number };
      if (!transcriptId) throw new ValidationError({ formErrors: ["transcriptId is required"] });

      const result = await aiService.summarize(authUser.id, transcriptId, { maxLength });
      return reply.send(result);
    }
  );

  app.post(
    "/translate",
    {
      schema: {
        tags: ["AI"],
        summary: "Translate transcript",
        description: "Translate a transcript to another language using AI",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["transcriptId", "targetLanguage"],
          properties: {
            transcriptId: { type: "string", format: "uuid" },
            targetLanguage: { type: "string", minLength: 2, maxLength: 10 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              translatedText: { type: "string" },
              sourceLanguage: { type: "string" },
              targetLanguage: { type: "string" },
            },
          },
          401: errorSchema,
          404: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { transcriptId, targetLanguage } = request.body as { transcriptId: string; targetLanguage: string };
      if (!transcriptId || !targetLanguage) {
        throw new ValidationError({ formErrors: ["transcriptId and targetLanguage are required"] });
      }

      const result = await aiService.translate(authUser.id, transcriptId, targetLanguage);
      return reply.send(result);
    }
  );

  app.post(
    "/analyze",
    {
      schema: {
        tags: ["AI"],
        summary: "Analyze transcript",
        description: "Analyze a transcript for sentiment, topics, and action items using AI",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["transcriptId"],
          properties: {
            transcriptId: { type: "string", format: "uuid" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              sentiment: { type: "string" },
              sentimentScore: { type: "number" },
              keyTopics: { type: "array", items: { type: "string" } },
              actionItems: { type: "array", items: { type: "string" } },
              summary: { type: "string" },
              wordCount: { type: "integer" },
              readingTimeMinutes: { type: "number" },
            },
          },
          401: errorSchema,
          404: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { transcriptId } = request.body as { transcriptId: string };
      if (!transcriptId) throw new ValidationError({ formErrors: ["transcriptId is required"] });

      const result = await aiService.analyze(authUser.id, transcriptId);
      return reply.send(result);
    }
  );

  app.get(
    "/usage",
    {
      schema: {
        tags: ["AI"],
        summary: "Get usage statistics",
        description: "Get current usage statistics and quota limits",
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: "object",
            properties: {
              usage: {
                type: "object",
                properties: {
                  transcriptionMinutes: { type: "integer" },
                  aiRequests: { type: "integer" },
                  storageBytes: { type: "integer" },
                },
              },
              limits: {
                type: "object",
                properties: {
                  transcriptionMinutes: { type: "integer" },
                  aiRequests: { type: "integer" },
                  storageBytes: { type: "integer" },
                },
              },
              tier: { type: "string" },
              periodStart: { type: "string", format: "date-time" },
              periodEnd: { type: "string", format: "date-time" },
            },
          },
          401: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const result = await aiService.getUsage(authUser.id);
      return reply.send(result);
    }
  );

  app.post(
    "/complete",
    {
      schema: {
        tags: ["AI"],
        summary: "Complete a prompt",
        description: "Send a system/user prompt pair to the AI model and receive a completion. Used by the frontend cloud provider.",
        security: [{ bearerAuth: [] }],
        body: {
          type: "object",
          required: ["system", "user"],
          properties: {
            system: { type: "string", minLength: 1 },
            user: { type: "string", minLength: 1 },
            model: { type: "string" },
            temperature: { type: "number", minimum: 0, maximum: 2 },
            maxTokens: { type: "integer", minimum: 1, maximum: 16384 },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              text: { type: "string" },
              usage: {
                type: "object",
                nullable: true,
                properties: {
                  promptTokens: { type: "integer" },
                  completionTokens: { type: "integer" },
                  totalTokens: { type: "integer" },
                },
              },
            },
          },
          401: errorSchema,
          422: errorSchema,
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authUser = (request as any).authUser as { id: string };
      const { system, user, model, temperature, maxTokens } = request.body as {
        system: string;
        user: string;
        model?: string;
        temperature?: number;
        maxTokens?: number;
      };

      if (!system || !user) {
        throw new ValidationError({ formErrors: ["system and user fields are required"] });
      }

      const result = await aiService.complete(authUser.id, system, user, { model, temperature, maxTokens });
      return reply.send({ success: true, text: result.text, usage: result.usage });
    }
  );
}
