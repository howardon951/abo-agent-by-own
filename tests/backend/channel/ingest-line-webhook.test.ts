import test from "node:test";
import assert from "node:assert/strict";
import { encryptSecret } from "@/lib/utils/crypto";
import { computeLineSignature } from "@/server/services/line/line-signature";
import {
  ingestLineWebhook,
  LineWebhookSignatureError,
  type LineWebhookRepository
} from "@/server/domain/channel/ingest-line-webhook";

const encryptionKey = Buffer.alloc(32, 3).toString("base64");
const channelSecret = "line-webhook-secret";

function createRepository(overrides: Partial<LineWebhookRepository> = {}) {
  const calls: string[] = [];
  const webhookEvents = new Set<string>();
  const messages = new Map<string, string>();
  let contactCounter = 0;
  let conversationCounter = 0;
  let messageCounter = 0;
  let activeConversationId: string | null = null;

  const repository: LineWebhookRepository = {
    async listVerificationCandidates() {
      calls.push("listVerificationCandidates");
      return [
        {
          tenantId: "tenant-1",
          channelId: "channel-1",
          channelSecretCiphertext: encryptSecret(channelSecret, encryptionKey)
        }
      ];
    },
    async findWebhookEvent(providerEventId) {
      calls.push(`findWebhookEvent:${providerEventId}`);
      return webhookEvents.has(providerEventId) ? { id: providerEventId } : null;
    },
    async insertWebhookEvent(input) {
      calls.push(`insertWebhookEvent:${input.providerEventId}:${input.eventType}`);
      webhookEvents.add(input.providerEventId);
    },
    async getActiveAgentId(tenantId) {
      calls.push(`getActiveAgentId:${tenantId}`);
      return "agent-1";
    },
    async upsertContact(input) {
      calls.push(`upsertContact:${input.externalUserId}`);
      contactCounter += 1;
      return { id: `contact-${contactCounter}` };
    },
    async findOpenConversation() {
      calls.push("findOpenConversation");
      return activeConversationId ? { id: activeConversationId } : null;
    },
    async createConversation() {
      calls.push("createConversation");
      conversationCounter += 1;
      activeConversationId = `conversation-${conversationCounter}`;
      return { id: activeConversationId };
    },
    async updateConversationLastMessage() {
      calls.push("updateConversationLastMessage");
    },
    async findMessageByExternalId(input) {
      calls.push(`findMessageByExternalId:${input.externalMessageId}`);
      const messageId = messages.get(input.externalMessageId);
      return messageId ? { id: messageId } : null;
    },
    async insertInboundMessage(input) {
      calls.push(`insertInboundMessage:${input.externalMessageId}`);
      messageCounter += 1;
      const id = `message-${messageCounter}`;
      messages.set(input.externalMessageId, id);
      return { id };
    },
    async enqueueMessageJob(input) {
      calls.push(`enqueueMessageJob:${input.messageId}`);
    },
    ...overrides
  };

  return { repository, calls };
}

test("ingests a valid LINE text message webhook into events, messages, and jobs", async () => {
  const body = JSON.stringify({
    destination: "Ubot",
    events: [
      {
        type: "message",
        mode: "active",
        timestamp: 1710000000000,
        webhookEventId: "event-1",
        replyToken: "reply-token-1",
        deliveryContext: { isRedelivery: false },
        source: {
          type: "user",
          userId: "Uuser"
        },
        message: {
          id: "message-1",
          type: "text",
          text: "今天營業到幾點？"
        }
      }
    ]
  });
  const signature = computeLineSignature(body, channelSecret);
  const { repository, calls } = createRepository();

  const result = await ingestLineWebhook(
    {
      body,
      signature
    },
    repository,
    encryptionKey
  );

  assert.deepEqual(result, {
    tenantId: "tenant-1",
    channelId: "channel-1",
    receivedEvents: 1,
    acceptedMessages: 1,
    skippedEvents: 0,
    duplicateEvents: 0,
    enqueuedJobs: 1
  });
  assert.deepEqual(calls, [
    "listVerificationCandidates",
    "findWebhookEvent:event-1",
    "insertWebhookEvent:event-1:message",
    "upsertContact:Uuser",
    "findOpenConversation",
    "getActiveAgentId:tenant-1",
    "createConversation",
    "findMessageByExternalId:message-1",
    "insertInboundMessage:message-1",
    "enqueueMessageJob:message-1"
  ]);
});

test("records non-text events but does not enqueue runtime jobs", async () => {
  const body = JSON.stringify({
    destination: "Ubot",
    events: [
      {
        type: "message",
        timestamp: 1710000000000,
        webhookEventId: "event-image",
        source: {
          type: "user",
          userId: "Uuser"
        },
        message: {
          id: "image-1",
          type: "image"
        }
      }
    ]
  });
  const signature = computeLineSignature(body, channelSecret);
  const { repository } = createRepository();

  const result = await ingestLineWebhook(
    {
      body,
      signature
    },
    repository,
    encryptionKey
  );

  assert.equal(result.receivedEvents, 1);
  assert.equal(result.acceptedMessages, 0);
  assert.equal(result.skippedEvents, 1);
  assert.equal(result.enqueuedJobs, 0);
});

test("rejects invalid signatures before ingesting anything", async () => {
  const body = JSON.stringify({
    destination: "Ubot",
    events: []
  });
  const { repository } = createRepository();

  await assert.rejects(
    () =>
      ingestLineWebhook(
        {
          body,
          signature: "invalid-signature"
        },
        repository,
        encryptionKey
      ),
    LineWebhookSignatureError
  );
});
