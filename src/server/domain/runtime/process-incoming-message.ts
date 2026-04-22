import { lineClient } from "@/server/services/line/line-client";
import { selectScenario } from "@/server/domain/scenario/select-scenario";
import { retrieveContext } from "@/server/services/retrieval/retriever";
import { llmProvider } from "@/server/services/llm/llm-provider";
import { logError, logInfo } from "@/lib/utils/logger";
import { requireAdminClient } from "@/lib/supabase/admin";
import { lineConfigEncryptionKey } from "@/lib/env";
import { decryptSecret } from "@/lib/utils/crypto";

export type ProcessIncomingMessageInput = {
  tenantId: string;
  conversationId: string;
  messageId: string;
  channelId: string;
  externalUserId: string;
  message: string;
  replyToken: string | null;
};

type ConversationRuntimeState = {
  status: "bot_active" | "handoff_requested" | "human_active" | "closed";
  agentId: string;
};

type HandoffRule = {
  id: string;
  name: string;
  keywords: string[];
  autoReplyText: string;
};

export type RuntimeRepository = {
  getConversationState(tenantId: string, conversationId: string): Promise<ConversationRuntimeState>;
  listEnabledHandoffRules(tenantId: string, agentId: string): Promise<HandoffRule[]>;
  getChannelAccessToken(tenantId: string, channelId: string): Promise<string>;
  insertAssistantMessage(input: {
    tenantId: string;
    conversationId: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<void>;
  markConversationHumanActive(input: {
    tenantId: string;
    conversationId: string;
    at: string;
  }): Promise<void>;
  updateConversationLastMessage(input: {
    tenantId: string;
    conversationId: string;
    lastMessageAt: string;
  }): Promise<void>;
};

type RuntimeDependencies = {
  selectScenario: typeof selectScenario;
  retrieveContext: typeof retrieveContext;
  llmProvider: typeof llmProvider;
  lineClient: Pick<typeof lineClient, "replyText">;
};

const defaultDependencies: RuntimeDependencies = {
  selectScenario,
  retrieveContext,
  llmProvider,
  lineClient
};

export async function processIncomingMessage(
  input: ProcessIncomingMessageInput,
  repository: RuntimeRepository = createSupabaseRuntimeRepository(),
  dependencies: RuntimeDependencies = defaultDependencies
) {
  logInfo("runtime processing started", {
    tenantId: input.tenantId,
    conversationId: input.conversationId,
    messageId: input.messageId,
    channelId: input.channelId,
    externalUserId: input.externalUserId,
    messageLength: input.message.length
  });

  try {
    const conversation = await repository.getConversationState(input.tenantId, input.conversationId);
    if (conversation.status === "human_active") {
      logInfo("runtime skipped", {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        reason: "human_active"
      });

      return {
        status: "skipped" as const,
        reason: "human_active" as const
      };
    }

    const handoffRules = await repository.listEnabledHandoffRules(input.tenantId, conversation.agentId);
    const matchedHandoffRule = findMatchedHandoffRule(input.message, handoffRules);

    if (matchedHandoffRule) {
      const repliedAt = new Date().toISOString();

      if (input.replyToken) {
        const channelAccessToken = await repository.getChannelAccessToken(input.tenantId, input.channelId);

        await dependencies.lineClient.replyText({
          channelAccessToken,
          replyToken: input.replyToken,
          text: matchedHandoffRule.autoReplyText
        });

        await repository.insertAssistantMessage({
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          content: matchedHandoffRule.autoReplyText,
          metadata: {
            kind: "handoff_auto_reply",
            handoffRuleId: matchedHandoffRule.id,
            handoffRuleName: matchedHandoffRule.name,
            userMessageId: input.messageId
          }
        });

        await repository.updateConversationLastMessage({
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          lastMessageAt: repliedAt
        });
      }

      await repository.markConversationHumanActive({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        at: repliedAt
      });

      logInfo("runtime handoff activated", {
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        handoffRuleId: matchedHandoffRule.id,
        handoffRuleName: matchedHandoffRule.name,
        replied: Boolean(input.replyToken)
      });

      return {
        status: "handoff" as const,
        handoffRule: matchedHandoffRule
      };
    }

    const scenario = await dependencies.selectScenario(input.message);
    logInfo("runtime scenario selected", {
      channelId: input.channelId,
      scenarioType: scenario.scenarioType,
      scenarioName: scenario.name
    });

    const retrieval = await dependencies.retrieveContext(input.message);
    logInfo("runtime retrieval completed", {
      channelId: input.channelId,
      retrievedCount: retrieval.length,
      topScore: retrieval[0]?.score ?? null
    });

    const completion = await dependencies.llmProvider.generate({
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

      await dependencies.lineClient.replyText({
        channelAccessToken,
        replyToken: input.replyToken,
        text: completion.text
      });

      const repliedAt = new Date().toISOString();
      await repository.insertAssistantMessage({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        content: completion.text,
        metadata: {
          kind: "llm_reply",
          provider: completion.provider,
          model: completion.model,
          scenarioId: scenario.id,
          scenarioType: scenario.scenarioType,
          scenarioName: scenario.name,
          userMessageId: input.messageId
        }
      });

      await repository.updateConversationLastMessage({
        tenantId: input.tenantId,
        conversationId: input.conversationId,
        lastMessageAt: repliedAt
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
  const admin = requireAdminClient();

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
    },

    async getConversationState(tenantId, conversationId) {
      const { data, error } = await admin
        .from("conversations")
        .select("status, agent_id")
        .eq("tenant_id", tenantId)
        .eq("id", conversationId)
        .single();

      if (error) {
        throw error;
      }

      return {
        status: data.status,
        agentId: data.agent_id
      };
    },

    async listEnabledHandoffRules(tenantId, agentId) {
      const { data, error } = await admin
        .from("agent_handoff_rules")
        .select("id, rule_name, keywords, auto_reply_text")
        .eq("tenant_id", tenantId)
        .eq("agent_id", agentId)
        .eq("is_enabled", true)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map((row) => ({
        id: row.id,
        name: row.rule_name,
        keywords: row.keywords ?? [],
        autoReplyText: row.auto_reply_text
      }));
    },

    async insertAssistantMessage(input) {
      const { error } = await admin.from("messages").insert({
        tenant_id: input.tenantId,
        conversation_id: input.conversationId,
        role: "assistant",
        source: "system",
        content: input.content,
        metadata: input.metadata
      });

      if (error) {
        throw error;
      }
    },

    async markConversationHumanActive(input) {
      const { error } = await admin
        .from("conversations")
        .update({
          status: "human_active",
          handoff_requested_at: input.at,
          human_activated_at: input.at
        })
        .eq("tenant_id", input.tenantId)
        .eq("id", input.conversationId);

      if (error) {
        throw error;
      }
    },

    async updateConversationLastMessage(input) {
      const { error } = await admin
        .from("conversations")
        .update({
          last_message_at: input.lastMessageAt
        })
        .eq("tenant_id", input.tenantId)
        .eq("id", input.conversationId);

      if (error) {
        throw error;
      }
    }
  };
}

function findMatchedHandoffRule(message: string, handoffRules: HandoffRule[]) {
  return handoffRules.find((rule) =>
    rule.keywords.some((keyword) => keyword.trim().length > 0 && message.includes(keyword))
  );
}
