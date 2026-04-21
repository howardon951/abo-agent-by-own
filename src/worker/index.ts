import { logInfo } from "@/lib/utils/logger";
import { resolveWorkerPollConfig, runWorkerLoop } from "@/worker/polling-worker";

async function main() {
  const config = resolveWorkerPollConfig();
  let stopRequested = false;

  const stop = (signal: string) => {
    if (stopRequested) {
      return;
    }

    stopRequested = true;
    logInfo("worker shutdown requested", { signal });
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  await runWorkerLoop(
    {
      shouldStop: () => stopRequested
    },
    config
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
