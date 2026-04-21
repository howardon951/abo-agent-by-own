import test from "node:test";
import assert from "node:assert/strict";
import { processMessageJob } from "@/worker/process-message-job";
import type { ClaimedMessageJob } from "@/server/services/jobs/claim-job";

const claimedJob: ClaimedMessageJob = {
  id: "job-1",
  tenantId: "tenant-1",
  conversationId: "conversation-1",
  messageId: "message-1",
  retryCount: 0,
  maxRetries: 5,
  channelId: "channel-1",
  externalUserId: "Uuser",
  message: "今天營業到幾點？",
  replyToken: "reply-token-1"
};

test("returns idle when no queued job is available", async () => {
  const calls: string[] = [];

  const result = await processMessageJob({
    async claimNextJob() {
      calls.push("claimNextJob");
      return null;
    },
    async processIncomingMessage() {
      calls.push("processIncomingMessage");
      throw new Error("should not run");
    },
    async completeJob() {
      calls.push("completeJob");
    },
    async failJob() {
      calls.push("failJob");
    }
  });

  assert.deepEqual(result, {
    status: "idle"
  });
  assert.deepEqual(calls, ["claimNextJob"]);
});

test("completes a claimed message job after runtime succeeds", async () => {
  const calls: string[] = [];

  const result = await processMessageJob({
    async claimNextJob() {
      calls.push("claimNextJob");
      return claimedJob;
    },
    async processIncomingMessage(input) {
      calls.push(`processIncomingMessage:${input.message}`);
      assert.equal(input.replyToken, "reply-token-1");
      return {
        status: "completed" as const,
        scenario: { id: "scenario-store", name: "門市資訊", scenarioType: "store_info" },
        retrieval: [],
        completion: { text: "我們營業到 20:00", provider: "mock", model: "mock-runtime-v1" }
      };
    },
    async completeJob(jobId) {
      calls.push(`completeJob:${jobId}`);
    },
    async failJob() {
      calls.push("failJob");
    }
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, [
    "claimNextJob",
    "processIncomingMessage:今天營業到幾點？",
    "completeJob:job-1"
  ]);
});

test("requeues or dead-letters the job when runtime fails", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      processMessageJob({
        async claimNextJob() {
          calls.push("claimNextJob");
          return claimedJob;
        },
        async processIncomingMessage() {
          calls.push("processIncomingMessage");
          throw new Error("LINE reply failed");
        },
        async completeJob() {
          calls.push("completeJob");
        },
        async failJob(job, error, options) {
          calls.push(`failJob:${job.id}:${error}:${options?.retryable ?? true}`);
        }
      }),
    {
      message: "LINE reply failed"
    }
  );

  assert.deepEqual(calls, [
    "claimNextJob",
    "processIncomingMessage",
    "failJob:job-1:LINE reply failed:true"
  ]);
});

test("dead-letters invalid LINE reply tokens without retrying", async () => {
  const calls: string[] = [];

  await assert.rejects(
    () =>
      processMessageJob({
        async claimNextJob() {
          calls.push("claimNextJob");
          return claimedJob;
        },
        async processIncomingMessage() {
          calls.push("processIncomingMessage");
          throw new Error('LINE reply failed: 400 {"message":"Invalid reply token"}');
        },
        async completeJob() {
          calls.push("completeJob");
        },
        async failJob(job, error, options) {
          calls.push(`failJob:${job.id}:${error}:${options?.retryable ?? true}`);
        }
      }),
    {
      message: 'LINE reply failed: 400 {"message":"Invalid reply token"}'
    }
  );

  assert.deepEqual(calls, [
    "claimNextJob",
    "processIncomingMessage",
    'failJob:job-1:LINE reply failed: 400 {"message":"Invalid reply token"}:false'
  ]);
});
