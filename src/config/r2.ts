import { S3Client } from "@aws-sdk/client-s3";

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

  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }

  return `${config.endpoint}/${config.bucket}/${key}`;
}
