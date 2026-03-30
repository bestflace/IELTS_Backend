import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const ASR_QUEUE_NAME = "asr";

export const ASR_JOB = {
  SPEAKING_TRANSCRIBE: "SPEAKING_TRANSCRIBE",
} as const;

export const asrQueue = new Queue(ASR_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

export async function enqueueSpeakingAsr(attemptId: string) {
  return asrQueue.add(
    ASR_JOB.SPEAKING_TRANSCRIBE,
    { attemptId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 200,
      jobId: `speaking-asr:${attemptId}`,
    },
  );
}
