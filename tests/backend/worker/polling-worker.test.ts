import test from "node:test";
import assert from "node:assert/strict";
import { resolveWorkerPollConfig, runWorkerLoop } from "@/worker/polling-worker";

test("uses the default worker polling intervals when env is unset", () => {
  assert.deepEqual(resolveWorkerPollConfig({}), {
    idlePollIntervalMs: 2000,
    activePollIntervalMs: 250,
    errorPollIntervalMs: 5000
  });
});

test("reads worker polling intervals from env", () => {
  assert.deepEqual(
    resolveWorkerPollConfig({
      WORKER_IDLE_POLL_INTERVAL_MS: "5000",
      WORKER_ACTIVE_POLL_INTERVAL_MS: "100",
      WORKER_ERROR_POLL_INTERVAL_MS: "9000"
    }),
    {
      idlePollIntervalMs: 5000,
      activePollIntervalMs: 100,
      errorPollIntervalMs: 9000
    }
  );
});

test("rejects invalid worker polling intervals", () => {
  assert.throws(
    () =>
      resolveWorkerPollConfig({
        WORKER_IDLE_POLL_INTERVAL_MS: "-1"
      }),
    {
      message: "invalid worker poll interval: -1"
    }
  );
});

test("waits for the idle interval after an idle poll", async () => {
  const sleeps: number[] = [];
  let stopRequested = false;

  await runWorkerLoop(
    {
      shouldStop: () => stopRequested
    },
    {
      idlePollIntervalMs: 2000,
      activePollIntervalMs: 250,
      errorPollIntervalMs: 5000
    },
    {
      async processMessageJob() {
        return { status: "idle" as const };
      },
      async sleep(ms) {
        sleeps.push(ms);
        stopRequested = true;
      }
    }
  );

  assert.deepEqual(sleeps, [2000]);
});

test("waits for the active interval after a completed job", async () => {
  const sleeps: number[] = [];
  let stopRequested = false;

  await runWorkerLoop(
    {
      shouldStop: () => stopRequested
    },
    {
      idlePollIntervalMs: 2000,
      activePollIntervalMs: 250,
      errorPollIntervalMs: 5000
    },
    {
      async processMessageJob() {
        return {
          status: "completed" as const,
          scenario: { id: "scenario-store", name: "門市資訊", scenarioType: "store_info" },
          retrieval: [],
          completion: { text: "ok", provider: "mock", model: "mock-runtime-v1" }
        };
      },
      async sleep(ms) {
        sleeps.push(ms);
        stopRequested = true;
      }
    }
  );

  assert.deepEqual(sleeps, [250]);
});

test("waits for the error interval after a failed iteration", async () => {
  const sleeps: number[] = [];
  let stopRequested = false;

  await runWorkerLoop(
    {
      shouldStop: () => stopRequested
    },
    {
      idlePollIntervalMs: 2000,
      activePollIntervalMs: 250,
      errorPollIntervalMs: 5000
    },
    {
      async processMessageJob() {
        throw new Error("boom");
      },
      async sleep(ms) {
        sleeps.push(ms);
        stopRequested = true;
      }
    }
  );

  assert.deepEqual(sleeps, [5000]);
});
