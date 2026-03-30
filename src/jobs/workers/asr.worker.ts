import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import { ASR_JOB, ASR_QUEUE_NAME } from "../queues/asr.queue";
import { processSpeakingAsr } from "../processors/asr.processor";

export const asrWorker = new Worker(
  ASR_QUEUE_NAME,
  async (job) => {
    if (job.name === ASR_JOB.SPEAKING_TRANSCRIBE) {
      return processSpeakingAsr(job.data.attemptId);
    }

    throw new Error(`Unknown ASR job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: 2,
  },
);
