import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import {
  AiGradingJobData,
  GRADING_JOB,
  GRADING_QUEUE_NAME,
} from "../queues/grading.queue";
import {
  processSpeakingAiGrading,
  processWritingAiGrading,
} from "../processors/grading.processor";

export const gradingWorker = new Worker<AiGradingJobData>(
  GRADING_QUEUE_NAME,
  async (job) => {
    if (job.name === GRADING_JOB.WRITING_AI) {
      return processWritingAiGrading(job);
    }

    if (job.name === GRADING_JOB.SPEAKING_AI) {
      return processSpeakingAiGrading(job);
    }

    throw new Error(`Unknown grading job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: Number(process.env.GRADING_WORKER_CONCURRENCY || 2),
    lockDuration: Number(
      process.env.GRADING_WORKER_LOCK_DURATION_MS || 180_000,
    ),
    stalledInterval: Number(
      process.env.GRADING_WORKER_STALLED_INTERVAL_MS || 30_000,
    ),
    maxStalledCount: 1,
  },
);
