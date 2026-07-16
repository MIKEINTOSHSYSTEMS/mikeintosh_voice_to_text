import { z } from "zod";

export const createTranscriptSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().optional(),
  duration: z.number().int().min(0).default(0),
  wordCount: z.number().int().min(0).default(0),
  charCount: z.number().int().min(0).default(0),
  language: z.string().max(10).default("am-ET"),
  source: z.enum(["microphone", "upload"]).default("microphone"),
  metadata: z.record(z.unknown()).default({}),
});

export const updateTranscriptSchema = z.object({
  title: z.string().max(500).optional(),
  content: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  wordCount: z.number().int().min(0).optional(),
  charCount: z.number().int().min(0).optional(),
  language: z.string().max(10).optional(),
  source: z.enum(["microphone", "upload"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listTranscriptsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateTranscriptInput = z.infer<typeof createTranscriptSchema>;
export type UpdateTranscriptInput = z.infer<typeof updateTranscriptSchema>;
export type ListTranscriptsQuery = z.infer<typeof listTranscriptsQuerySchema>;
