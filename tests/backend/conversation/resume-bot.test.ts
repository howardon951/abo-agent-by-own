import test from "node:test";
import assert from "node:assert/strict";
import {
  resumeConversationBot,
  type ResumeConversationBotRepository
} from "@/server/domain/conversation/resume-bot";

test("resumes a human conversation back to bot_active within the tenant scope", async () => {
  const calls: string[] = [];

  const repository: ResumeConversationBotRepository = {
    async resumeConversation(tenantId, conversationId) {
      calls.push(`resumeConversation:${tenantId}:${conversationId}`);
      return {
        id: conversationId,
        status: "bot_active"
      };
    }
  };

  const result = await resumeConversationBot("tenant-1", "conversation-1", repository);

  assert.deepEqual(result, {
    id: "conversation-1",
    status: "bot_active"
  });
  assert.deepEqual(calls, ["resumeConversation:tenant-1:conversation-1"]);
});
