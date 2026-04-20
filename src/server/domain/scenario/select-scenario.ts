export async function selectScenario(input: string) {
  if (input.includes("營業") || input.includes("地址")) {
    return { id: "scenario-store", name: "門市資訊", scenarioType: "store_info" };
  }

  if (input.includes("價格") || input.includes("費用")) {
    return { id: "scenario-sales", name: "售前問答", scenarioType: "pre_sales" };
  }

  return { id: "scenario-general", name: "一般 FAQ", scenarioType: "general_faq" };
}
