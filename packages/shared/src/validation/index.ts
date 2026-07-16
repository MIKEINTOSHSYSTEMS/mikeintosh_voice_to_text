import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(255).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTranscriptInput = z.infer<typeof createTranscriptSchema>;
export type UpdateTranscriptInput = z.infer<typeof updateTranscriptSchema>;
