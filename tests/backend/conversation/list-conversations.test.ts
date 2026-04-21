import test from "node:test";
import assert from "node:assert/strict";
import {
  listConversations,
  type ListConversationsRepository
} from "@/server/domain/conversation/list-conversations";

test("lists tenant conversations with contact fallback and latest message snippets", async () => {
  const calls: string[] = [];

  const repository: ListConversationsRepository = {
    async listConversationRows(tenantId) {
      calls.push(`listConversationRows:${tenantId}`);
      return [
        {
          id: "conversation-2",
          status: "human_active",
          last_message_at: "2026-04-21T10:05:00Z",
          contact: {
            display_name: null,
            external_user_id: "U-line-2"
          }
        },
        {
          id: "conversation-1",
          status: "bot_active",
          last_message_at: "2026-04-21T10:00:00Z",
          contact: {
            display_name: "LINE User A",
            external_user_id: "U-line-1"
          }
        }
      ];
    },
    async listLatestMessages(tenantId, conversationIds) {
      calls.push(`listLatestMessages:${tenantId}:${conversationIds.join(",")}`);
      return [
        {
          conversation_id: "conversation-2",
          content: "我要退貨",
          created_at: "2026-04-21T10:05:00Z"
        },
        {
          conversation_id: "conversation-1",
          content: "今天營業到幾點？",
          created_at: "2026-04-21T10:00:00Z"
        }
      ];
    }
  };

  const result = await listConversations("tenant-1", repository);

  assert.deepEqual(result, {
    items: [
      {
        id: "conversation-2",
        status: "human_active",
        contactDisplayName: "U-line-2",
        lastMessageAt: "2026-04-21T10:05:00Z",
        lastMessageSnippet: "我要退貨"
      },
      {
        id: "conversation-1",
        status: "bot_active",
        contactDisplayName: "LINE User A",
        lastMessageAt: "2026-04-21T10:00:00Z",
        lastMessageSnippet: "今天營業到幾點？"
      }
    ],
    nextCursor: null
  });
  assert.deepEqual(calls, [
    "listConversationRows:tenant-1",
    "listLatestMessages:tenant-1:conversation-2,conversation-1"
  ]);
});

test("returns an empty list without querying messages when no conversations exist", async () => {
  const calls: string[] = [];

  const repository: ListConversationsRepository = {
    async listConversationRows(tenantId) {
      calls.push(`listConversationRows:${tenantId}`);
      return [];
    },
    async listLatestMessages() {
      calls.push("listLatestMessages");
      return [];
    }
  };

  const result = await listConversations("tenant-1", repository);

  assert.deepEqual(result, {
    items: [],
    nextCursor: null
  });
  assert.deepEqual(calls, ["listConversationRows:tenant-1"]);
});
