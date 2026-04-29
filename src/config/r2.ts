import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";

type R2Config = {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicUrl: string;
};

let r2Client: S3Client | null = null;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export function getR2Config(): R2Config {
  return {
    endpoint: getRequiredEnv("R2_ENDPOINT").replace(/\/+$/, ""),
    accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    bucket: getRequiredEnv("R2_BUCKET"),
    publicUrl: (process.env.R2_PUBLIC_URL ?? "").trim().replace(/\/+$/, ""),
  };
}

export function getR2Client(): S3Client {
  if (r2Client) {
    return r2Client;
  }

  const config = getR2Config();

  r2Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return r2Client;
}

export function buildR2FileUrl(key: string): string {
  const config = getR2Config();
  const cleanKey = key.replace(/^\/+/, "");

  if (config.publicUrl) {
    return `${config.publicUrl}/${cleanKey}`;
  }

  return `${config.endpoint}/${config.bucket}/${cleanKey}`;
}

export async function downloadR2ObjectToBuffer(params: {
  fileKey: string;
  maxBytes?: number;
}): Promise<{
  buffer: Buffer;
  contentType: string | null;
  contentLength: number | null;
  eTag: string | null;
}> {
  const config = getR2Config();
  const client = getR2Client();
  const cleanKey = params.fileKey.replace(/^\/+/, "");
  const maxBytes = params.maxBytes ?? 25 * 1024 * 1024;

  const result = await client.send(
    new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanKey,
    }),
  );

  const contentLength = result.ContentLength ?? null;

  if (contentLength !== null && contentLength > maxBytes) {
    throw new Error(`R2 object is too large for ASR: ${contentLength} bytes`);
  }

  if (!result.Body) {
    throw new Error(`R2 object has empty body: ${cleanKey}`);
  }

  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of result.Body as Readable) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;

    if (total > maxBytes) {
      throw new Error(`R2 object exceeded ASR size limit: ${total} bytes`);
    }

    chunks.push(buffer);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: result.ContentType ?? null,
    contentLength: contentLength ?? total,
    eTag: result.ETag ?? null,
  };
}
