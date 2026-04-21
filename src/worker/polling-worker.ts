import { logError, logInfo } from "@/lib/utils/logger";
import { processMessageJob } from "@/worker/process-message-job";

export type WorkerPollConfig = {
  idlePollIntervalMs: number;
  activePollIntervalMs: number;
  errorPollIntervalMs: number;
};

type WorkerLoopDependencies = {
  processMessageJob: typeof processMessageJob;
  sleep: (ms: number) => Promise<void>;
};

type WorkerStopSignal = {
  shouldStop: () => boolean;
};

const defaultDependencies: WorkerLoopDependencies = {
  processMessageJob,
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms))
};

export function resolveWorkerPollConfig(
  env: Record<string, string | undefined> = process.env
): WorkerPollConfig {
  return {
    idlePollIntervalMs: parseInterval(env.WORKER_IDLE_POLL_INTERVAL_MS, 2000),
    activePollIntervalMs: parseInterval(env.WORKER_ACTIVE_POLL_INTERVAL_MS, 250),
    errorPollIntervalMs: parseInterval(env.WORKER_ERROR_POLL_INTERVAL_MS, 5000)
  };
}

export async function runWorkerLoop(
  stopSignal: WorkerStopSignal,
  config: WorkerPollConfig,
  dependencies: WorkerLoopDependencies = defaultDependencies
) {
  logInfo("worker loop started", config);

  while (!stopSignal.shouldStop()) {
    try {
      const result = await dependencies.processMessageJob();
      if (stopSignal.shouldStop()) {
        break;
      }

      await dependencies.sleep(
        result.status === "idle" ? config.idlePollIntervalMs : config.activePollIntervalMs
      );
    } catch (error) {
      logError("worker loop iteration failed", {
        error: error instanceof Error ? error.message : String(error)
      });

      if (stopSignal.shouldStop()) {
        break;
      }

      await dependencies.sleep(config.errorPollIntervalMs);
    }
  }

  logInfo("worker loop stopped");
}

function parseInterval(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`invalid worker poll interval: ${value}`);
  }

  return parsed;
}
