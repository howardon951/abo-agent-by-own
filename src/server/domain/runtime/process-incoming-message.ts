import { lineClient } from "@/server/services/line/line-client";
import { selectScenario } from "@/server/domain/scenario/select-scenario";
import { retrieveContext } from "@/server/services/retrieval/retriever";
import { llmProvider } from "@/server/services/llm/llm-provider";
import { logError, logInfo } from "@/lib/utils/logger";

export async function processIncomingMessage(input: {
  channelId: string;
  externalUserId: string;
  message: string;
}) {
  logInfo("runtime processing started", {
    channelId: input.channelId,
    externalUserId: input.externalUserId,
    messageLength: input.message.length
  });

  try {
    const scenario = await selectScenario(input.message);
    logInfo("runtime scenario selected", {
      channelId: input.channelId,
      scenarioType: scenario.scenarioType,
      scenarioName: scenario.name
    });

    const retrieval = await retrieveContext(input.message);
    logInfo("runtime retrieval completed", {
      channelId: input.channelId,
      retrievedCount: retrieval.length,
      topScore: retrieval[0]?.score ?? null
    });

    const completion = await llmProvider.generate({
      userInput: input.message,
      scenario: scenario.name,
      context: retrieval.map((item) => item.content)
    });
    logInfo("runtime llm completed", {
      channelId: input.channelId,
      provider: completion.provider,
      model: completion.model
    });

    await lineClient.replyText({
      replyToken: "stub-reply-token",
      text: completion.text
    });

    logInfo("runtime reply dispatched", {
      channelId: input.channelId,
      replyLength: completion.text.length
    });

    return {
      status: "completed" as const,
      scenario,
      retrieval,
      completion
    };
  } catch (error) {
    logError("runtime processing failed", {
      channelId: input.channelId,
      externalUserId: input.externalUserId,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
