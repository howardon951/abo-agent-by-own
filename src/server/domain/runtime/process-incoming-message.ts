import { lineClient } from "@/server/services/line/line-client";
import { selectScenario } from "@/server/domain/scenario/select-scenario";
import { retrieveContext } from "@/server/services/retrieval/retriever";
import { llmProvider } from "@/server/services/llm/llm-provider";
import { logError, logInfo } from "@/lib/utils/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { lineConfigEncryptionKey } from "@/lib/env";
import { decryptSecret } from "@/lib/utils/crypto";

export type ProcessIncomingMessageInput = {
  tenantId: string;
  channelId: string;
  externalUserId: string;
  message: string;
  replyToken: string | null;
};

export type RuntimeRepository = {
  getChannelAccessToken(tenantId: string, channelId: string): Promise<string>;
};

export async function processIncomingMessage(
  input: ProcessIncomingMessageInput,
  repository: RuntimeRepository = createSupabaseRuntimeRepository()
) {
  logInfo("runtime processing started", {
    tenantId: input.tenantId,
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

    if (input.replyToken) {
      const channelAccessToken = await repository.getChannelAccessToken(input.tenantId, input.channelId);

      await lineClient.replyText({
        channelAccessToken,
        replyToken: input.replyToken,
        text: completion.text
      });
    } else {
      logInfo("runtime reply skipped", {
        channelId: input.channelId,
        reason: "missing_reply_token"
      });
    }

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

export function createSupabaseRuntimeRepository(): RuntimeRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async getChannelAccessToken(tenantId, channelId) {
      if (!lineConfigEncryptionKey) {
        throw new Error("LINE_CONFIG_ENCRYPTION_KEY is not configured");
      }

      const { data, error } = await admin
        .from("line_channel_configs")
        .select("channel_access_token_ciphertext")
        .eq("tenant_id", tenantId)
        .eq("channel_id", channelId)
        .single();

      if (error) {
        throw error;
      }

      return decryptSecret(data.channel_access_token_ciphertext, lineConfigEncryptionKey);
    }
  };
}
