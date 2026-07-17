import { prisma } from "../lib/prisma.js";
import { summarizeTranscript, translateTranscript, analyzeTranscript, completeLLM } from "../ai/pipeline/index.js";
import { addJob } from "./queue.service.js";
import { NotFoundError, ForbiddenError, ValidationError } from "../lib/errors.js";

export interface UsageLimits {
  transcriptionMinutes: number;
  aiRequests: number;
  storageBytes: number;
}

const TIER_LIMITS: Record<string, UsageLimits> = {
  free: { transcriptionMinutes: 60, aiRequests: 20, storageBytes: 100 * 1024 * 1024 },
  pro: { transcriptionMinutes: 600, aiRequests: 500, storageBytes: 5 * 1024 * 1024 * 1024 },
  team: { transcriptionMinutes: 3000, aiRequests: 999999, storageBytes: 50 * 1024 * 1024 * 1024 },
};

export async function getUsage(userId: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let usage = await prisma.usage.findUnique({ where: { userId } });

  if (!usage || usage.periodStart < periodStart) {
    usage = await prisma.usage.upsert({
      where: { userId },
      create: {
        userId,
        transcriptionMinutes: 0,
        aiRequests: 0,
        storageBytes: 0,
        periodStart,
        periodEnd,
      },
      update: {
        transcriptionMinutes: 0,
        aiRequests: 0,
        storageBytes: 0,
        periodStart,
        periodEnd,
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = user?.tier || "free";
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  return {
    usage: {
      transcriptionMinutes: usage.transcriptionMinutes,
      aiRequests: usage.aiRequests,
      storageBytes: Number(usage.storageBytes),
    },
    limits,
    tier,
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
  };
}

export async function checkQuota(userId: string, type: "transcription" | "ai_request" | "storage", amount = 1) {
  const { usage, limits } = await getUsage(userId);

  switch (type) {
    case "transcription":
      if (usage.transcriptionMinutes + amount > limits.transcriptionMinutes) {
        throw new ValidationError({ formErrors: ["Transcription quota exceeded. Upgrade your plan."] });
      }
      break;
    case "ai_request":
      if (usage.aiRequests + amount > limits.aiRequests) {
        throw new ValidationError({ formErrors: ["AI request quota exceeded. Upgrade your plan."] });
      }
      break;
    case "storage":
      if (usage.storageBytes + amount > limits.storageBytes) {
        throw new ValidationError({ formErrors: ["Storage quota exceeded. Upgrade your plan."] });
      }
      break;
  }
}

export async function incrementUsage(userId: string, type: "transcription_minutes" | "ai_requests" | "storage_bytes", amount = 1) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const fieldMap: Record<string, string> = {
    transcription_minutes: "transcriptionMinutes",
    ai_requests: "aiRequests",
    storage_bytes: "storageBytes",
  };
  const field = fieldMap[type] || type;

  await prisma.usage.upsert({
    where: { userId },
    create: {
      userId,
      transcriptionMinutes: type === "transcription_minutes" ? amount : 0,
      aiRequests: type === "ai_requests" ? amount : 0,
      storageBytes: type === "storage_bytes" ? amount : 0,
      periodStart,
      periodEnd,
    },
    update: {
      [field]: { increment: amount },
      periodEnd,
    },
  });
}

export async function summarize(userId: string, transcriptId: string, options?: { maxLength?: number }) {
  const transcript = await prisma.transcript.findUnique({ where: { id: transcriptId } });
  if (!transcript) throw new NotFoundError("Transcript not found");
  if (transcript.userId !== userId) throw new ForbiddenError("Access denied");
  if (!transcript.content) throw new ValidationError({ formErrors: ["Transcript has no content"] });

  await checkQuota(userId, "ai_request");
  await incrementUsage(userId, "ai_requests");

  const result = await summarizeTranscript(transcript.content, options);
  return result;
}

export async function translate(userId: string, transcriptId: string, targetLanguage: string) {
  const transcript = await prisma.transcript.findUnique({ where: { id: transcriptId } });
  if (!transcript) throw new NotFoundError("Transcript not found");
  if (transcript.userId !== userId) throw new ForbiddenError("Access denied");
  if (!transcript.content) throw new ValidationError({ formErrors: ["Transcript has no content"] });

  await checkQuota(userId, "ai_request");
  await incrementUsage(userId, "ai_requests");

  const result = await translateTranscript(transcript.content, targetLanguage);
  return result;
}

export async function analyze(userId: string, transcriptId: string) {
  const transcript = await prisma.transcript.findUnique({ where: { id: transcriptId } });
  if (!transcript) throw new NotFoundError("Transcript not found");
  if (transcript.userId !== userId) throw new ForbiddenError("Access denied");
  if (!transcript.content) throw new ValidationError({ formErrors: ["Transcript has no content"] });

  await checkQuota(userId, "ai_request");
  await incrementUsage(userId, "ai_requests");

  const result = await analyzeTranscript(transcript.content);
  return result;
}

export async function complete(
  userId: string,
  system: string,
  user: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  await checkQuota(userId, "ai_request");
  await incrementUsage(userId, "ai_requests");
  return completeLLM(system, user, options);
}
