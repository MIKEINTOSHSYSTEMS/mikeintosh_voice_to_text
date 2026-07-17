import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { getConfig } from "../config.js";

let _connection: IORedis | null = null;
let _queue: Queue | null = null;

export function getRedisConnection(): IORedis {
  if (_connection) return _connection;
  _connection = new IORedis(getConfig().REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
  return _connection;
}

export function getJobQueue(): Queue {
  if (_queue) return _queue;
  _queue = new Queue("ai-jobs", {
    connection: getRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });
  return _queue;
}

export interface JobData {
  type: "transcription" | "summarize" | "translate" | "analyze";
  userId: string;
  audioId?: string;
  transcriptId?: string;
  data: Record<string, unknown>;
}

export async function addJob(jobData: JobData, priority = 0): Promise<string> {
  const queue = getJobQueue();
  const job = await queue.add(jobData.type, jobData, {
    priority,
    jobId: `${jobData.type}-${jobData.userId}-${Date.now()}`,
  });
  return job.id!;
}

export function createWorker(
  processor: (jobData: JobData) => Promise<unknown>
): Worker {
  return new Worker(
    "ai-jobs",
    async (job) => {
      return processor(job.data as JobData);
    },
    {
      connection: getRedisConnection(),
      concurrency: 2,
    }
  );
}
