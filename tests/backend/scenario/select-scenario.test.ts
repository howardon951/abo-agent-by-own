import test from "node:test";
import assert from "node:assert/strict";
import { selectScenario } from "@/server/domain/scenario/select-scenario";

test("routes store information questions before other keyword matches", async () => {
  const result = await selectScenario("請問地址在哪裡，價格怎麼算？");

  assert.deepEqual(result, {
    id: "scenario-store",
    name: "門市資訊",
    scenarioType: "store_info"
  });
});

test("routes pricing questions to the pre-sales scenario", async () => {
  const result = await selectScenario("你們的費用方案是多少？");

  assert.deepEqual(result, {
    id: "scenario-sales",
    name: "售前問答",
    scenarioType: "pre_sales"
  });
});

test("falls back to the general faq scenario when no rule matches", async () => {
  const result = await selectScenario("你們品牌理念是什麼？");

  assert.deepEqual(result, {
    id: "scenario-general",
    name: "一般 FAQ",
    scenarioType: "general_faq"
  });
});
