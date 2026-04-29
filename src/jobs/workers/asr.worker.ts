import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import {
  ASR_JOB,
  ASR_QUEUE_NAME,
  SpeakingAsrJobData,
} from "../queues/asr.queue";
import { processSpeakingAsr } from "../processors/asr.processor";

export const asrWorker = new Worker<SpeakingAsrJobData>(
  ASR_QUEUE_NAME,
  async (job) => {
    if (job.name === ASR_JOB.SPEAKING_TRANSCRIBE) {
      return processSpeakingAsr(job);
    }

    throw new Error(`Unknown ASR job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: Number(process.env.ASR_WORKER_CONCURRENCY || 2),
    lockDuration: Number(process.env.ASR_WORKER_LOCK_DURATION_MS || 180_000),
    stalledInterval: Number(
      process.env.ASR_WORKER_STALLED_INTERVAL_MS || 30_000,
    ),
    maxStalledCount: 1,
  },
);
