import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

export async function authMiddleware(this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace("Bearer ", "")
      || (request.query as { token?: string }).token;
    if (!token) {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Missing authorization token" },
      });
    }

    const decoded = this.jwt.verify<{ sub: string; email: string }>(token);
    (request as any).authUser = { id: decoded.sub, email: decoded.email };
  } catch {
    return reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Invalid or expired token" },
    });
  }
}
