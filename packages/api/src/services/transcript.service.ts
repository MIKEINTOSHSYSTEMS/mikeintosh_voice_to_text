import { prisma } from "../lib/prisma.js";
import { NotFoundError, ForbiddenError } from "../lib/errors.js";
import type { CreateTranscriptInput, UpdateTranscriptInput, ListTranscriptsQuery } from "../validation/transcript.js";
import type { Prisma } from "@prisma/client";

export async function listTranscripts(userId: string, query: ListTranscriptsQuery) {
  const { page, limit, search, sort, order } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.TranscriptWhereInput = {
    userId,
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [transcripts, total] = await Promise.all([
    prisma.transcript.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sort]: order },
      select: {
        id: true,
        title: true,
        duration: true,
        wordCount: true,
        charCount: true,
        language: true,
        source: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.transcript.count({ where }),
  ]);

  return {
    transcripts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function createTranscript(userId: string, input: CreateTranscriptInput) {
  const data: Prisma.TranscriptUncheckedCreateInput = {
    userId,
    title: input.title,
    content: input.content,
    duration: input.duration,
    wordCount: input.wordCount,
    charCount: input.charCount,
    language: input.language,
    source: input.source,
    metadata: input.metadata as Prisma.InputJsonValue,
  };

  return prisma.transcript.create({ data });
}

export async function getTranscript(userId: string, id: string) {
  const transcript = await prisma.transcript.findUnique({ where: { id } });
  if (!transcript) throw new NotFoundError("Transcript");
  if (transcript.userId !== userId) throw new ForbiddenError("Access denied");
  return transcript;
}

export async function updateTranscript(userId: string, id: string, input: UpdateTranscriptInput) {
  const existing = await prisma.transcript.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Transcript");
  if (existing.userId !== userId) throw new ForbiddenError("Access denied");

  const data: Prisma.TranscriptUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) data.content = input.content;
  if (input.duration !== undefined) data.duration = input.duration;
  if (input.wordCount !== undefined) data.wordCount = input.wordCount;
  if (input.charCount !== undefined) data.charCount = input.charCount;
  if (input.language !== undefined) data.language = input.language;
  if (input.source !== undefined) data.source = input.source;
  if (input.metadata !== undefined) data.metadata = input.metadata as Prisma.InputJsonValue;

  return prisma.transcript.update({ where: { id }, data });
}

export async function deleteTranscript(userId: string, id: string) {
  const existing = await prisma.transcript.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Transcript");
  if (existing.userId !== userId) throw new ForbiddenError("Access denied");

  await prisma.transcript.delete({ where: { id } });
  return { deleted: true };
}
