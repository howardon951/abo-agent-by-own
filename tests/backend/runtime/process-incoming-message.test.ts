import test from "node:test";
import assert from "node:assert/strict";
import {
  processIncomingMessage,
  type RuntimeRepository
} from "@/server/domain/runtime/process-incoming-message";

function createRepository(overrides: Partial<RuntimeRepository> = {}) {
  const calls: string[] = [];

  const repository: RuntimeRepository = {
    async getConversationState(tenantId, conversationId) {
      calls.push(`getConversationState:${tenantId}:${conversationId}`);
      return {
        status: "bot_active",
        agentId: "agent-1"
      };
    },
    async listEnabledHandoffRules(tenantId, agentId) {
      calls.push(`listEnabledHandoffRules:${tenantId}:${agentId}`);
      return [];
    },
    async getChannelAccessToken(tenantId, channelId) {
      calls.push(`getChannelAccessToken:${tenantId}:${channelId}`);
      return "channel-access-token";
    },
    async insertAssistantMessage(input) {
      calls.push(`insertAssistantMessage:${input.content}`);
    },
    async markConversationHumanActive(input) {
      calls.push(`markConversationHumanActive:${input.conversationId}`);
    },
    async updateConversationLastMessage(input) {
      calls.push(`updateConversationLastMessage:${input.conversationId}`);
    },
    ...overrides
  };

  return { repository, calls };
}

function createDependencies() {
  const calls: string[] = [];

  return {
    calls,
    dependencies: {
      async selectScenario(input: string) {
        calls.push(`selectScenario:${input}`);
        return {
          id: "scenario-store",
          name: "門市資訊",
          scenarioType: "store_info"
        };
      },
      async retrieveContext(input: string) {
        calls.push(`retrieveContext:${input}`);
        return [
          {
            documentTitle: "常見問題",
            score: 0.92,
            content: "營業時間為每日 10:00-20:00。"
          }
        ];
      },
      llmProvider: {
        async generate() {
          calls.push("llmProvider.generate");
          return {
            text: "我們每日營業時間為 10:00 到 20:00。",
            provider: "mock",
            model: "mock-runtime-v1"
          };
        }
      },
      lineClient: {
        async replyText(input: { replyToken: string; text: string }) {
          calls.push(`lineClient.replyText:${input.replyToken}:${input.text}`);
          return { ok: true as const };
        }
      }
    }
  };
}

const baseInput = {
  tenantId: "tenant-1",
  conversationId: "conversation-1",
  messageId: "message-1",
  channelId: "channel-1",
  externalUserId: "Uuser",
  message: "今天營業到幾點？",
  replyToken: "reply-token-1"
};

test("skips runtime when conversation is already human_active", async () => {
  const { repository, calls } = createRepository({
    async getConversationState(tenantId, conversationId) {
      calls.push(`getConversationState:${tenantId}:${conversationId}`);
      return {
        status: "human_active",
        agentId: "agent-1"
      };
    }
  });
  const { dependencies, calls: dependencyCalls } = createDependencies();

  const result = await processIncomingMessage(baseInput, repository, dependencies);

  assert.deepEqual(result, {
    status: "skipped",
    reason: "human_active"
  });
  assert.deepEqual(calls, ["getConversationState:tenant-1:conversation-1"]);
  assert.deepEqual(dependencyCalls, []);
});

test("activates handoff, replies fixed text, and persists assistant handoff message", async () => {
  const insertedMessages: Array<{ content: string; metadata: Record<string, unknown> }> = [];
  const { repository, calls } = createRepository({
    async listEnabledHandoffRules(tenantId, agentId) {
      calls.push(`listEnabledHandoffRules:${tenantId}:${agentId}`);
      return [
        {
          id: "rule-1",
          name: "Default Handoff",
          keywords: ["真人", "客服"],
          autoReplyText: "已轉由真人協助，請稍候"
        }
      ];
    },
    async insertAssistantMessage(input) {
      calls.push(`insertAssistantMessage:${input.content}`);
      insertedMessages.push({
        content: input.content,
        metadata: input.metadata
      });
    }
  });
  const { dependencies, calls: dependencyCalls } = createDependencies();

  const result = await processIncomingMessage(
    {
      ...baseInput,
      message: "我要找真人客服"
    },
    repository,
    dependencies
  );

  assert.equal(result.status, "handoff");
  assert.equal(result.handoffRule.id, "rule-1");
  assert.deepEqual(calls, [
    "getConversationState:tenant-1:conversation-1",
    "listEnabledHandoffRules:tenant-1:agent-1",
    "getChannelAccessToken:tenant-1:channel-1",
    "insertAssistantMessage:已轉由真人協助，請稍候",
    "updateConversationLastMessage:conversation-1",
    "markConversationHumanActive:conversation-1"
  ]);
  assert.deepEqual(dependencyCalls, ["lineClient.replyText:reply-token-1:已轉由真人協助，請稍候"]);
  assert.deepEqual(insertedMessages, [
    {
      content: "已轉由真人協助，請稍候",
      metadata: {
        kind: "handoff_auto_reply",
        handoffRuleId: "rule-1",
        handoffRuleName: "Default Handoff",
        userMessageId: "message-1"
      }
    }
  ]);
});

test("replies with llm output and persists assistant message for bot_active conversations", async () => {
  const insertedMessages: Array<{ content: string; metadata: Record<string, unknown> }> = [];
  const { repository, calls } = createRepository({
    async insertAssistantMessage(input) {
      calls.push(`insertAssistantMessage:${input.content}`);
      insertedMessages.push({
        content: input.content,
        metadata: input.metadata
      });
    }
  });
  const { dependencies, calls: dependencyCalls } = createDependencies();

  const result = await processIncomingMessage(baseInput, repository, dependencies);

  assert.equal(result.status, "completed");
  assert.deepEqual(calls, [
    "getConversationState:tenant-1:conversation-1",
    "listEnabledHandoffRules:tenant-1:agent-1",
    "getChannelAccessToken:tenant-1:channel-1",
    "insertAssistantMessage:我們每日營業時間為 10:00 到 20:00。",
    "updateConversationLastMessage:conversation-1"
  ]);
  assert.deepEqual(dependencyCalls, [
    "selectScenario:今天營業到幾點？",
    "retrieveContext:今天營業到幾點？",
    "llmProvider.generate",
    "lineClient.replyText:reply-token-1:我們每日營業時間為 10:00 到 20:00。"
  ]);
  assert.deepEqual(insertedMessages, [
    {
      content: "我們每日營業時間為 10:00 到 20:00。",
      metadata: {
        kind: "llm_reply",
        provider: "mock",
        model: "mock-runtime-v1",
        scenarioId: "scenario-store",
        scenarioType: "store_info",
        scenarioName: "門市資訊",
        userMessageId: "message-1"
      }
    }
  ]);
});
