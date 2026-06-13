import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const GRADING_QUEUE_NAME = "grading";

export const GRADING_JOB = {
  WRITING_AI: "WRITING_AI",
  SPEAKING_AI: "SPEAKING_AI",
} as const;

export type AiGradingJobData = {
  attemptId: string;
  aiGradingId?: string;
};

export const gradingQueue = new Queue<AiGradingJobData>(GRADING_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

function normalizeAiGradingPayload(
  input: string | AiGradingJobData,
): AiGradingJobData {
  return typeof input === "string" ? { attemptId: input } : input;
}

function safeJobId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export async function enqueueWritingAiGrading(
  input: string | AiGradingJobData,
) {
  const data = normalizeAiGradingPayload(input);

  return gradingQueue.add(GRADING_JOB.WRITING_AI, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 200,
    removeOnFail: 200,
    jobId: safeJobId(`writing-ai-${data.aiGradingId ?? data.attemptId}`),
  });
}

export async function enqueueSpeakingAiGrading(
  input: string | AiGradingJobData,
) {
  const data = normalizeAiGradingPayload(input);

  return gradingQueue.add(GRADING_JOB.SPEAKING_AI, data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: 200,
    removeOnFail: 200,
    jobId: safeJobId(`speaking-ai-${data.aiGradingId ?? data.attemptId}`),
  });
}
