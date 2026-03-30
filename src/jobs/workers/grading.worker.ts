import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import { GRADING_JOB, GRADING_QUEUE_NAME } from "../queues/grading.queue";
import {
  processSpeakingAiGrading,
  processWritingAiGrading,
} from "../processors/grading.processor";

export const gradingWorker = new Worker(
  GRADING_QUEUE_NAME,
  async (job) => {
    if (job.name === GRADING_JOB.WRITING_AI) {
      return processWritingAiGrading(job.data.attemptId);
    }

    if (job.name === GRADING_JOB.SPEAKING_AI) {
      return processSpeakingAiGrading(job.data.attemptId);
    }

    throw new Error(`Unknown grading job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: 2,
  },
);
