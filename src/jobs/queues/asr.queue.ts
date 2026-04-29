import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const ASR_QUEUE_NAME = "asr";

export const ASR_JOB = {
  SPEAKING_TRANSCRIBE: "SPEAKING_TRANSCRIBE",
} as const;

export type SpeakingAsrJobData = {
  attemptId: string;
  asrJobId: string;
  speakingResponseId: string;
};

export const asrQueue = new Queue<SpeakingAsrJobData>(ASR_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

export async function enqueueSpeakingAsr(data: SpeakingAsrJobData) {
  return asrQueue.add(ASR_JOB.SPEAKING_TRANSCRIBE, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 200,
    removeOnFail: 200,
    jobId: `speaking-asr:${data.speakingResponseId}`,
  });
}
