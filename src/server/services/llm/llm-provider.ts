export type LlmGenerateInput = {
  userInput: string;
  scenario: string;
  context: string[];
};

export type LlmGenerateResult = {
  text: string;
  provider: string;
  model: string;
};

class MockLlmProvider {
  async generate(input: LlmGenerateInput): Promise<LlmGenerateResult> {
    const answer = input.userInput.includes("營業")
      ? "我們每日營業時間為 10:00 到 20:00。"
      : `這是 ${input.scenario} 的範例回覆，之後會接上真實模型。`;

    return {
      text: answer,
      provider: "mock",
      model: "mock-runtime-v1"
    };
  }
}

export const llmProvider = new MockLlmProvider();
