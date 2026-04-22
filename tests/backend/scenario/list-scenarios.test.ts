import test from "node:test";
import assert from "node:assert/strict";
import {
  listScenarios,
  updateScenario,
  type ScenarioRepository
} from "@/server/domain/scenario/list-scenarios";

function createRepository(overrides: Partial<ScenarioRepository> = {}) {
  const calls: string[] = [];

  const scenarios = [
    {
      id: "scenario-general",
      scenarioType: "general_faq",
      name: "一般 FAQ",
      routingKeywords: [],
      promptConfig: { objective: "回答一般問題" },
      isEnabled: true
    },
    {
      id: "scenario-sales",
      scenarioType: "pre_sales",
      name: "售前問答",
      routingKeywords: ["價格", "費用", "方案"],
      promptConfig: { objective: "回答售前問題" },
      isEnabled: true
    }
  ];

  const repository: ScenarioRepository = {
    async listScenarios(tenantId) {
      calls.push(`listScenarios:${tenantId}`);
      return scenarios;
    },
    async updateScenario(tenantId, scenarioId, input) {
      calls.push(`updateScenario:${tenantId}:${scenarioId}`);
      const current = scenarios.find((scenario) => scenario.id === scenarioId) ?? scenarios[0];
      return {
        ...current,
        ...input,
        routingKeywords: input.routingKeywords ?? current.routingKeywords,
        promptConfig: input.promptConfig ?? current.promptConfig,
        isEnabled: input.isEnabled ?? current.isEnabled
      };
    },
    ...overrides
  };

  return { repository, calls, scenarios };
}

test("lists scenarios for the current tenant from the repository", async () => {
  const { repository, calls, scenarios } = createRepository();

  const result = await listScenarios("tenant-1", repository);

  assert.deepEqual(result, scenarios);
  assert.deepEqual(calls, ["listScenarios:tenant-1"]);
});

test("updates a tenant scenario through the repository", async () => {
  const { repository, calls } = createRepository();

  const result = await updateScenario(
    "tenant-1",
    "scenario-sales",
    {
      name: "售前銷售問答",
      routingKeywords: ["報價", "價格"],
      isEnabled: false
    },
    repository
  );

  assert.deepEqual(result, {
    id: "scenario-sales",
    scenarioType: "pre_sales",
    name: "售前銷售問答",
    routingKeywords: ["報價", "價格"],
    promptConfig: { objective: "回答售前問題" },
    isEnabled: false
  });

  assert.deepEqual(calls, ["updateScenario:tenant-1:scenario-sales"]);
});
