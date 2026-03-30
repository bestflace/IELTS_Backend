import { Worker } from "bullmq";
import { getBullMQConnection, getQueuePrefix } from "../../config/redis";
import { IMPORT_JOB, IMPORT_QUEUE_NAME } from "../queues/import.queue";
import { processImportJob } from "../processors/import.processor";

export const importWorker = new Worker(
  IMPORT_QUEUE_NAME,
  async (job) => {
    if (job.name === IMPORT_JOB.PROCESS_IMPORT) {
      return processImportJob(job.data.importJobId);
    }

    throw new Error(`Unknown import job: ${job.name}`);
  },
  {
    connection: getBullMQConnection(),
    prefix: getQueuePrefix(),
    concurrency: 2,
  },
);
