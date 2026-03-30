import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const GRADING_QUEUE_NAME = "grading";

export const GRADING_JOB = {
  WRITING_AI: "WRITING_AI",
  SPEAKING_AI: "SPEAKING_AI",
} as const;

export const gradingQueue = new Queue(GRADING_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

export async function enqueueWritingAiGrading(attemptId: string) {
  return gradingQueue.add(
    GRADING_JOB.WRITING_AI,
    { attemptId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 200,
      jobId: `writing-ai:${attemptId}`,
    },
  );
}

export async function enqueueSpeakingAiGrading(attemptId: string) {
  return gradingQueue.add(
    GRADING_JOB.SPEAKING_AI,
    { attemptId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 200,
      removeOnFail: 200,
      jobId: `speaking-ai:${attemptId}`,
    },
  );
}
