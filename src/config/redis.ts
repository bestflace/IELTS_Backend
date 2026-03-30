import IORedis, { RedisOptions } from "ioredis";

function getRedisOptions(): RedisOptions {
  const host = process.env.REDIS_HOST?.trim() || "127.0.0.1";
  const port = Number(process.env.REDIS_PORT || 6379);
  const password = process.env.REDIS_PASSWORD?.trim() || undefined;

  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  };
}

export function createRedisClient() {
  return new IORedis(getRedisOptions());
}

export function getBullMQConnection() {
  return getRedisOptions();
}

export function getQueuePrefix() {
  return process.env.QUEUE_PREFIX?.trim() || "ielts_backend";
}
