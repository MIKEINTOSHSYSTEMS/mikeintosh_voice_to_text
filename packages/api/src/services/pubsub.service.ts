import IORedis from "ioredis";
import { getConfig } from "../config.js";

let _publisher: IORedis | null = null;
let _subscriber: IORedis | null = null;

export function getPublisher(): IORedis {
  if (_publisher) return _publisher;
  _publisher = new IORedis(getConfig().REDIS_URL);
  return _publisher;
}

export function getSubscriber(): IORedis {
  if (_subscriber) return _subscriber;
  _subscriber = new IORedis(getConfig().REDIS_URL);
  return _subscriber;
}

export interface JobProgressEvent {
  jobId: string;
  status: string;
  progress: number;
  message: string;
  result?: unknown;
  error?: string;
  timestamp: string;
}

export function publishJobProgress(event: JobProgressEvent): void {
  const publisher = getPublisher();
  const channel = `job:${event.jobId}:progress`;
  publisher.publish(channel, JSON.stringify(event));
}

export function subscribeToJobProgress(
  jobId: string,
  callback: (event: JobProgressEvent) => void
): () => void {
  const subscriber = getSubscriber();
  const channel = `job:${jobId}:progress`;

  const handler = (_channel: string, message: string) => {
    try {
      const event = JSON.parse(message) as JobProgressEvent;
      callback(event);
    } catch {
      // ignore malformed messages
    }
  };

  subscriber.subscribe(channel);
  subscriber.on("message", handler);

  return () => {
    subscriber.removeListener("message", handler);
    subscriber.unsubscribe(channel);
  };
}
