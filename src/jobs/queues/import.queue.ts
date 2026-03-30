import { Queue } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";

export const IMPORT_QUEUE_NAME = "import";

export const IMPORT_JOB = {
  PROCESS_IMPORT: "PROCESS_IMPORT",
} as const;

export const importQueue = new Queue(IMPORT_QUEUE_NAME, {
  connection: getBullMQConnection(),
  prefix: getQueuePrefix(),
});

export async function enqueueImportJob(importJobId: string) {
  return importQueue.add(
    IMPORT_JOB.PROCESS_IMPORT,
    { importJobId },
    {
      attempts: 2,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 100,
      jobId: `import:${importJobId}:${Date.now()}`,
    },
  );
}
