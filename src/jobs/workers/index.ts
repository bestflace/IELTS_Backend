import { Worker } from "bullmq";
import { importWorker } from "./import.worker";
import { asrWorker } from "./asr.worker";
import { gradingWorker } from "./grading.worker";
import { notificationWorker } from "./notification.worker";

const workers: Array<{
  name: string;
  worker: Worker;
}> = [
  {
    name: "import",
    worker: importWorker,
  },
  {
    name: "asr",
    worker: asrWorker,
  },
  {
    name: "grading",
    worker: gradingWorker,
  },
  {
    name: "notification",
    worker: notificationWorker,
  },
];

function attachWorkerLogs(name: string, worker: Worker) {
  worker.on("ready", () => {
    console.log(`[worker:${name}] ready`);
  });

  worker.on("completed", (job) => {
    console.log(
      `[worker:${name}] completed job ${job.id ?? "unknown"} (${job.name})`,
    );
  });

  worker.on("failed", (job, error) => {
    console.error(
      `[worker:${name}] failed job ${job?.id ?? "unknown"} (${job?.name ?? "unknown"}):`,
      error,
    );
  });

  worker.on("error", (error) => {
    console.error(`[worker:${name}] error:`, error);
  });

  worker.on("stalled", (jobId) => {
    console.warn(`[worker:${name}] stalled job ${jobId}`);
  });
}

for (const item of workers) {
  attachWorkerLogs(item.name, item.worker);
}

console.log(
  `[worker] started ${workers.map((item) => item.name).join(", ")} workers`,
);

let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log(`[worker] received ${signal}, closing workers...`);

  const results = await Promise.allSettled(
    workers.map((item) => item.worker.close()),
  );

  for (const [index, result] of results.entries()) {
    const name = workers[index]?.name ?? `worker-${index}`;

    if (result.status === "fulfilled") {
      console.log(`[worker:${name}] closed`);
    } else {
      console.error(`[worker:${name}] close failed:`, result.reason);
    }
  }

  console.log("[worker] shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("unhandledRejection", (reason) => {
  console.error("[worker] unhandledRejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[worker] uncaughtException:", error);
  void shutdown("uncaughtException");
});
