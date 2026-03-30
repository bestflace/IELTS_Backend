import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import {
  NOTIFICATION_JOB,
  NOTIFICATION_QUEUE_NAME,
} from "../queues/notification.queue";
import {
  processSubmissionReviewedNotification,
  processTestPublishedNotification,
} from "../processors/notification.processor";

export const notificationWorker = new Worker(
  NOTIFICATION_QUEUE_NAME,
  async (job) => {
    if (job.name === NOTIFICATION_JOB.TEST_PUBLISHED) {
      return processTestPublishedNotification(job.data.testId);
    }

    if (job.name === NOTIFICATION_JOB.SUBMISSION_REVIEWED) {
      return processSubmissionReviewedNotification(job.data.attemptId);
    }

    throw new Error(`Unknown notification job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: 3,
  },
);
