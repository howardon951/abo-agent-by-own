import test from "node:test";
import assert from "node:assert/strict";
import {
  getCurrentAgent,
  updateCurrentAgent,
  type CurrentAgentRepository
} from "@/server/domain/agent/get-current-agent";

function createRepository(overrides: Partial<CurrentAgentRepository> = {}) {
  const calls: string[] = [];

  const agent = {
    id: "agent-1",
    name: "Main Agent",
    brandName: "Abo Coffee",
    brandTone: "親切、簡短、專業",
    forbiddenTopics: ["醫療建議"],
    fallbackPolicy: "若資料不足，請保守回答並請用戶稍候"
  };

  const repository: CurrentAgentRepository = {
    async getCurrentAgent(tenantId) {
      calls.push(`getCurrentAgent:${tenantId}`);
      return agent;
    },
    async updateCurrentAgent(tenantId, input) {
      calls.push(`updateCurrentAgent:${tenantId}`);
      return {
        ...agent,
        ...input,
        brandName: input.brandName ?? agent.brandName,
        brandTone: input.brandTone ?? agent.brandTone,
        forbiddenTopics: input.forbiddenTopics ?? agent.forbiddenTopics,
        fallbackPolicy: input.fallbackPolicy ?? agent.fallbackPolicy
      };
    },
    ...overrides
  };

  return { repository, calls, agent };
}

test("reads the active agent for the current tenant from the repository", async () => {
  const { repository, calls, agent } = createRepository();

  const result = await getCurrentAgent("tenant-1", repository);

  assert.deepEqual(result, { agent });
  assert.deepEqual(calls, ["getCurrentAgent:tenant-1"]);
});

test("updates the active agent for the current tenant through the repository", async () => {
  const { repository, calls } = createRepository();

  const result = await updateCurrentAgent(
    "tenant-1",
    {
      brandTone: "溫暖、清楚",
      forbiddenTopics: ["法律意見", "醫療建議"]
    },
    repository
  );

  assert.deepEqual(result, {
    agent: {
      id: "agent-1",
      name: "Main Agent",
      brandName: "Abo Coffee",
      brandTone: "溫暖、清楚",
      forbiddenTopics: ["法律意見", "醫療建議"],
      fallbackPolicy: "若資料不足，請保守回答並請用戶稍候"
    }
  });

  assert.deepEqual(calls, ["updateCurrentAgent:tenant-1"]);
});
