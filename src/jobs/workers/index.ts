import { importWorker } from "./import.worker";
import { asrWorker } from "./asr.worker";
import { gradingWorker } from "./grading.worker";
import { notificationWorker } from "./notification.worker";

function attachLogs(name: string, worker: any) {
  worker.on("completed", (job: any) => {
    console.log(`[${name}] completed job ${job.id}`);
  });

  worker.on("failed", (job: any, error: Error) => {
    console.error(`[${name}] failed job ${job?.id}:`, error.message);
  });
}

attachLogs("import", importWorker);
attachLogs("asr", asrWorker);
attachLogs("grading", gradingWorker);
attachLogs("notification", notificationWorker);

console.log("All workers started");
