import { prisma } from "../lib/prisma.js";
import { uploadAudio, deleteAudio, getAudioUrl } from "./storage.service.js";
import { addJob } from "./queue.service.js";
import { ValidationError, NotFoundError, ForbiddenError } from "../lib/errors.js";

export interface CreateAudioInput {
  filename: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export async function createAudio(userId: string, input: CreateAudioInput) {
  const storage = await uploadAudio(userId, input.filename, input.mimeType, input.buffer);

  const audio = await prisma.audio.create({
    data: {
      userId,
      filename: input.filename,
      mimeType: input.mimeType,
      size: input.size,
      s3Key: storage.key,
      s3Bucket: storage.bucket,
      status: "uploaded",
    },
  });

  return audio;
}

export async function getAudio(userId: string, audioId: string) {
  const audio = await prisma.audio.findUnique({ where: { id: audioId } });
  if (!audio) throw new NotFoundError("Audio file not found");
  if (audio.userId !== userId) throw new ForbiddenError("Access denied");
  return audio;
}

export async function listAudio(userId: string, options?: { page?: number; limit?: number }) {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const skip = (page - 1) * limit;

  const [audioFiles, total] = await Promise.all([
    prisma.audio.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.audio.count({ where: { userId } }),
  ]);

  return {
    audioFiles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function deleteAudioFile(userId: string, audioId: string) {
  const audio = await getAudio(userId, audioId);

  if (audio.s3Key) {
    await deleteAudio(audio.s3Key);
  }

  await prisma.audio.delete({ where: { id: audioId } });
}

export async function startTranscription(userId: string, audioId: string) {
  const audio = await getAudio(userId, audioId);

  if (audio.status === "transcribing") {
    throw new ValidationError({ formErrors: ["Transcription already in progress"] });
  }

  await prisma.audio.update({
    where: { id: audioId },
    data: { status: "transcribing" },
  });

  const [bullJobId, prismaJob] = await Promise.all([
    addJob({
      type: "transcription",
      userId,
      audioId,
      data: {
        s3Key: audio.s3Key,
        language: audio.language,
        mimeType: audio.mimeType,
      },
    }),
    prisma.job.create({
      data: {
        userId,
        audioId,
        type: "transcription",
        status: "queued",
        priority: 1,
      },
    }),
  ]);

  return { jobId: prismaJob.id, audioId };
}

export async function getAudioStatus(userId: string, audioId: string) {
  const audio = await getAudio(userId, audioId);
  const jobs = await prisma.job.findMany({
    where: { audioId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return { audio, jobs };
}
