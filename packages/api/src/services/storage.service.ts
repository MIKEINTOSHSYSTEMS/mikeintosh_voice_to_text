import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getConfig } from "../config.js";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;

  const config = getConfig();
  _client = new S3Client({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    credentials: config.S3_ACCESS_KEY && config.S3_SECRET_KEY
      ? {
          accessKeyId: config.S3_ACCESS_KEY,
          secretAccessKey: config.S3_SECRET_KEY,
        }
      : undefined,
  });

  return _client;
}

export async function ensureBucket(): Promise<void> {
  const config = getConfig();
  if (!config.S3_ENDPOINT || !config.S3_ACCESS_KEY) return;

  const client = getClient();
  try {
    await client.send(new HeadBucketCommand({ Bucket: config.S3_BUCKET }));
  } catch {
    try {
      await client.send(new CreateBucketCommand({ Bucket: config.S3_BUCKET }));
    } catch {
      // bucket may already exist from concurrent startup
    }
  }
}

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
}

export async function uploadAudio(
  userId: string,
  filename: string,
  contentType: string,
  data: Buffer
): Promise<UploadResult> {
  const config = getConfig();
  const key = `audio/${userId}/${Date.now()}-${filename}`;

  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
      Metadata: { userId },
    })
  );

  return { key, bucket: config.S3_BUCKET, size: data.length };
}

export async function getAudioUrl(key: string, expiresIn = 3600): Promise<string> {
  const config = getConfig();
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: config.S3_BUCKET,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn });
}

export async function deleteAudio(key: string): Promise<void> {
  const config = getConfig();
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
    })
  );
}

export async function getAudioBuffer(key: string): Promise<Buffer> {
  const config = getConfig();
  const client = getClient();
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.S3_BUCKET,
      Key: key,
    })
  );

  const stream = response.Body;
  if (!stream) throw new Error("No body in S3 response");

  const chunks: Uint8Array[] = [];
  const reader = stream.transformToWebStream().getReader();
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) chunks.push(result.value);
  }

  return Buffer.concat(chunks);
}
