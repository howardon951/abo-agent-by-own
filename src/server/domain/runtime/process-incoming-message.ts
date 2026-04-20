import { lineClient } from "@/server/services/line/line-client";
import { selectScenario } from "@/server/domain/scenario/select-scenario";
import { retrieveContext } from "@/server/services/retrieval/retriever";
import { llmProvider } from "@/server/services/llm/llm-provider";
import { logInfo } from "@/lib/utils/logger";

export async function processIncomingMessage(input: {
  channelId: string;
  externalUserId: string;
  message: string;
}) {
  const scenario = await selectScenario(input.message);
  const retrieval = await retrieveContext(input.message);
  const completion = await llmProvider.generate({
    userInput: input.message,
    scenario: scenario.name,
    context: retrieval.map((item) => item.content)
  });

  logInfo("processed incoming message", {
    channelId: input.channelId,
    scenario: scenario.name
  });

  await lineClient.replyText({
    replyToken: "stub-reply-token",
    text: completion.text
  });

  return {
    status: "completed" as const,
    scenario,
    retrieval,
    completion
  };
}
