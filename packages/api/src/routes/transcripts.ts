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

export async function transcriptRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authMiddleware);

  app.get("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = listTranscriptsQuerySchema.safeParse(request.query);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());

    const authUser = (request as any).authUser as { id: string };
    const result = await transcriptService.listTranscripts(authUser.id, parsed.data);
    return reply.send(result);
  });

  app.post("/", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = createTranscriptSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());

    const authUser = (request as any).authUser as { id: string };
    const transcript = await transcriptService.createTranscript(authUser.id, parsed.data);
    return reply.status(201).send({ transcript });
  });

  app.get("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const authUser = (request as any).authUser as { id: string };
    const transcript = await transcriptService.getTranscript(authUser.id, id);
    return reply.send({ transcript });
  });

  app.put("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const parsed = updateTranscriptSchema.safeParse(request.body);
    if (!parsed.success) throw new ValidationError(parsed.error.flatten());

    const authUser = (request as any).authUser as { id: string };
    const transcript = await transcriptService.updateTranscript(authUser.id, id, parsed.data);
    return reply.send({ transcript });
  });

  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const authUser = (request as any).authUser as { id: string };
    await transcriptService.deleteTranscript(authUser.id, id);
    return reply.status(204).send();
  });
}
