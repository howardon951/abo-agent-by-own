import test from "node:test";
import assert from "node:assert/strict";
import {
  getConversation,
  type GetConversationRepository
} from "@/server/domain/conversation/get-conversation";

test("returns a tenant-scoped conversation with ordered messages", async () => {
  const calls: string[] = [];

  const repository: GetConversationRepository = {
    async getConversationRow(tenantId, conversationId) {
      calls.push(`getConversationRow:${tenantId}:${conversationId}`);
      return {
        id: conversationId,
        status: "human_active",
        opened_at: "2026-04-21T09:50:00Z",
        last_message_at: "2026-04-21T10:05:00Z",
        handoff_requested_at: "2026-04-21T10:04:00Z",
        human_activated_at: "2026-04-21T10:04:00Z",
        scenario_id: null,
        contact: {
          id: "contact-1",
          display_name: null,
          external_user_id: "U-line-2"
        }
      };
    },
    async listConversationMessages(tenantId, conversationId) {
      calls.push(`listConversationMessages:${tenantId}:${conversationId}`);
      return [
        {
          id: "message-1",
          role: "user",
          source: "line_webhook",
          content: "我要找真人",
          created_at: "2026-04-21T10:03:00Z"
        },
        {
          id: "message-2",
          role: "assistant",
          source: "system",
          content: "已轉由真人協助，請稍候",
          created_at: "2026-04-21T10:04:00Z"
        }
      ];
    }
  };

  const result = await getConversation("tenant-1", "conversation-2", repository);

  assert.deepEqual(result, {
    id: "conversation-2",
    status: "human_active",
    openedAt: "2026-04-21T09:50:00Z",
    lastMessageAt: "2026-04-21T10:05:00Z",
    handoffRequestedAt: "2026-04-21T10:04:00Z",
    humanActivatedAt: "2026-04-21T10:04:00Z",
    scenarioId: null,
    contact: {
      id: "contact-1",
      displayName: "U-line-2",
      externalUserId: "U-line-2"
    },
    messages: [
      {
        id: "message-1",
        role: "user",
        source: "line_webhook",
        content: "我要找真人",
        createdAt: "2026-04-21T10:03:00Z"
      },
      {
        id: "message-2",
        role: "assistant",
        source: "system",
        content: "已轉由真人協助，請稍候",
        createdAt: "2026-04-21T10:04:00Z"
      }
    ]
  });
  assert.deepEqual(calls, [
    "getConversationRow:tenant-1:conversation-2",
    "listConversationMessages:tenant-1:conversation-2"
  ]);
});
