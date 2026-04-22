import test from "node:test";
import assert from "node:assert/strict";
import { patchScenarioRoute } from "@/app/api/scenarios/[scenarioId]/route";
import { type TenantScopedUser } from "@/lib/auth/guards";

const tenantUser: TenantScopedUser = {
  id: "user-tenant",
  email: "owner@example.com",
  role: "tenant_owner",
  tenantId: "tenant-1"
};

test("PATCH wraps the updated scenario under data.scenario", async () => {
  const response = await patchScenarioRoute(
    new Request("http://localhost/api/scenarios/scenario-sales", {
      method: "PATCH",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: "售前銷售問答",
        routingKeywords: ["報價", "價格"],
        promptConfig: { objective: "回答售前問題" },
        isEnabled: false
      })
    }),
    Promise.resolve({ scenarioId: "scenario-sales" }),
    {
      runTenantScopedRoute: async (handler) => handler(tenantUser),
      updateScenario: async (tenantId, scenarioId, input) => ({
        id: scenarioId,
        scenarioType: "pre_sales",
        name: input.name ?? "預設名稱",
        routingKeywords: input.routingKeywords ?? [],
        promptConfig: input.promptConfig ?? {},
        isEnabled: input.isEnabled ?? true
      })
    }
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: {
      scenario: {
        id: "scenario-sales",
        scenarioType: "pre_sales",
        name: "售前銷售問答",
        routingKeywords: ["報價", "價格"],
        promptConfig: { objective: "回答售前問題" },
        isEnabled: false
      }
    },
    error: null
  });
});
