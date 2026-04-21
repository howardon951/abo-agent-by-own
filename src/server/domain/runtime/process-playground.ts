import { logError, logInfo } from "@/lib/utils/logger";

export async function processPlaygroundRun(input: { input: string; scenarioHint?: string }) {
  const scenarioType = input.scenarioHint ?? "store_info";

  logInfo("playground run started", {
    scenarioHint: input.scenarioHint ?? null,
    inputLength: input.input.length
  });

  try {
    const result = {
      scenario: {
        id: "scenario-store",
        scenarioType,
        name: scenarioType === "store_info" ? "門市資訊" : "一般 FAQ"
      },
      retrieval: [
        {
          documentTitle: "常見問題",
          score: 0.92,
          content: "營業時間為每日 10:00-20:00。"
        },
        {
          documentTitle: "門市資訊頁",
          score: 0.87,
          content: "門市地址與營業資訊都在此頁。"
        }
      ],
      output: input.input.includes("營業")
        ? "我們每日營業時間為 10:00 到 20:00。"
        : "這是 Playground 的範例回覆，之後會改成真實 runtime。"
    };

    logInfo("playground run completed", {
      scenarioType: result.scenario.scenarioType,
      retrievedCount: result.retrieval.length
    });

    return result;
  } catch (error) {
    logError("playground run failed", {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
