import { Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";
import { loadConfig } from "./config.js";
import { prisma } from "./lib/prisma.js";
import { transcribeAudio } from "./ai/pipeline/index.js";
import { getAudioBuffer } from "./services/storage.service.js";
import { incrementUsage } from "./services/ai.service.js";

loadConfig();

const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
});

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

interface JobData {
  type: "transcription" | "summarize" | "translate" | "analyze";
  userId: string;
  audioId?: string;
  transcriptId?: string;
  data: Record<string, unknown>;
}

async function processTranscription(jobData: JobData) {
  const { userId, audioId, data } = jobData;

  const audio = await prisma.audio.findUnique({ where: { id: audioId! } });
  if (!audio || !audio.s3Key) throw new Error("Audio file not found or missing S3 key");

  const audioBuffer = await getAudioBuffer(audio.s3Key);
  const result = await transcribeAudio(audioBuffer, {
    language: (data.language as string) || "am",
  });

  const transcript = await prisma.transcript.create({
    data: {
      userId,
      title: audio.filename.replace(/\.[^/.]+$/, ""),
      content: result.text,
      duration: Math.round(result.duration),
      wordCount: result.text.split(/\s+/).length,
      charCount: result.text.length,
      language: result.language,
      source: "upload",
      metadata: { segments: result.segments },
    },
  });

  await prisma.audio.update({
    where: { id: audioId! },
    data: { status: "completed", duration: Math.round(result.duration) },
  });

  const durationMinutes = Math.ceil(result.duration / 60);
  await incrementUsage(userId, "transcription_minutes", durationMinutes);

  return { transcriptId: transcript.id, text: result.text };
}

async function processor(jobData: JobData) {
  let job = await prisma.job.findFirst({
    where: {
      userId: jobData.userId,
      audioId: jobData.audioId,
      type: jobData.type,
      status: { in: ["pending", "queued"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!job) {
    job = await prisma.job.create({
      data: {
        userId: jobData.userId,
        audioId: jobData.audioId,
        transcriptId: jobData.transcriptId,
        type: jobData.type,
        status: "active",
        startedAt: new Date(),
      },
    });
  } else {
    job = await prisma.job.update({
      where: { id: job.id },
      data: { status: "active", startedAt: new Date() },
    });
  }

  try {
    let result;
    switch (jobData.type) {
      case "transcription":
        result = await processTranscription(jobData);
        break;
      default:
        throw new Error(`Unsupported job type: ${jobData.type}`);
    }

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "completed", progress: 100, result, completedAt: new Date() },
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "failed", error: errorMessage },
    });
    if (jobData.audioId) {
      await prisma.audio.update({
        where: { id: jobData.audioId },
        data: { status: "failed" },
      });
    }
    throw error;
  }
}

const worker = new Worker(
  "ai-jobs",
  async (job) => processor(job.data as JobData),
  { connection, concurrency: 2 }
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "Job completed successfully");
});

worker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, error: err.message }, "Job failed");
});

worker.on("ready", () => {
  logger.info("Worker ready, listening for jobs...");
});

process.on("SIGTERM", async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
