import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const NOTIFICATION_QUEUE_NAME = "notification";

export const NOTIFICATION_JOB = {
  TEST_PUBLISHED: "TEST_PUBLISHED",
  SUBMISSION_REVIEWED: "SUBMISSION_REVIEWED",
} as const;

export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

export async function enqueueTestPublishedNotification(testId: string) {
  return notificationQueue.add(
    NOTIFICATION_JOB.TEST_PUBLISHED,
    { testId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 200,
      removeOnFail: 200,
      jobId: `test-published:${testId}:${Date.now()}`,
    },
  );
}

export async function enqueueSubmissionReviewedNotification(attemptId: string) {
  return notificationQueue.add(
    NOTIFICATION_JOB.SUBMISSION_REVIEWED,
    { attemptId },
    {
      attempts: 3,
      backoff: { type: "exponential", delay: 3000 },
      removeOnComplete: 200,
      removeOnFail: 200,
      jobId: `submission-reviewed:${attemptId}:${Date.now()}`,
    },
  );
}
