import type { FastifyInstance } from "fastify";

export async function healthRoutes(app: FastifyInstance) {
  app.get(
    "/api/health",
    {
      schema: {
        tags: ["Health"],
        summary: "Health check",
        description: "Returns server status and timestamp",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              timestamp: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    async () => {
      return { status: "ok", timestamp: new Date().toISOString() };
    }
  );
}
