import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { lineConfigEncryptionKey } from "@/lib/env";
import { decryptSecret } from "@/lib/utils/crypto";
import { verifyLineSignature } from "@/server/services/line/line-signature";

type LineWebhookSource = {
  type: "user" | "group" | "room";
  userId?: string;
  groupId?: string;
  roomId?: string;
};

type LineTextMessageEvent = {
  type: "message";
  mode?: string;
  timestamp: number;
  webhookEventId?: string;
  deliveryContext?: {
    isRedelivery?: boolean;
  };
  replyToken?: string;
  source: LineWebhookSource;
  message: {
    id: string;
    type: "text";
    text: string;
  };
};

type LineNonTextMessageEvent = {
  type: "message";
  timestamp: number;
  webhookEventId?: string;
  source: LineWebhookSource;
  message: {
    id?: string;
    type: string;
  };
};

type LineOtherEvent = {
  type: string;
  timestamp: number;
  webhookEventId?: string;
  source?: LineWebhookSource;
};

type LineWebhookEvent = LineTextMessageEvent | LineNonTextMessageEvent | LineOtherEvent;

type LineWebhookPayload = {
  destination?: string;
  events: LineWebhookEvent[];
};

type VerificationCandidate = {
  tenantId: string;
  channelId: string;
  channelSecretCiphertext: string;
};

type ContactRecord = {
  id: string;
};

type ConversationRecord = {
  id: string;
};

type MessageRecord = {
  id: string;
  created: boolean;
};

export type IngestLineWebhookInput = {
  body: string;
  signature?: string | null;
};

export type IngestLineWebhookResult = {
  tenantId: string;
  channelId: string;
  receivedEvents: number;
  acceptedMessages: number;
  skippedEvents: number;
  duplicateEvents: number;
  enqueuedJobs: number;
};

export type LineWebhookRepository = {
  listVerificationCandidates(): Promise<VerificationCandidate[]>;
  findWebhookEvent(providerEventId: string): Promise<{ id: string } | null>;
  insertWebhookEvent(input: {
    tenantId: string;
    channelId: string;
    providerEventId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
  getActiveAgentId(tenantId: string): Promise<string>;
  upsertContact(input: {
    tenantId: string;
    channelId: string;
    externalUserId: string;
    lastSeenAt: string;
  }): Promise<ContactRecord>;
  findOpenConversation(input: {
    tenantId: string;
    channelId: string;
    contactId: string;
  }): Promise<ConversationRecord | null>;
  createConversation(input: {
    tenantId: string;
    channelId: string;
    contactId: string;
    agentId: string;
    openedAt: string;
    lastMessageAt: string;
  }): Promise<ConversationRecord>;
  updateConversationLastMessage(input: {
    tenantId: string;
    conversationId: string;
    lastMessageAt: string;
  }): Promise<void>;
  findMessageByExternalId(input: {
    tenantId: string;
    externalMessageId: string;
  }): Promise<{ id: string } | null>;
  insertInboundMessage(input: {
    tenantId: string;
    conversationId: string;
    externalMessageId: string;
    content: string;
    metadata: Record<string, unknown>;
  }): Promise<{ id: string }>;
  enqueueMessageJob(input: {
    tenantId: string;
    conversationId: string;
    messageId: string;
  }): Promise<void>;
};

export class LineWebhookSignatureError extends Error {
  constructor(message = "invalid line signature") {
    super(message);
    this.name = "LineWebhookSignatureError";
  }
}

export class LineWebhookPayloadError extends Error {
  constructor(message = "invalid line webhook payload") {
    super(message);
    this.name = "LineWebhookPayloadError";
  }
}

export async function ingestLineWebhook(
  input: IngestLineWebhookInput,
  repository: LineWebhookRepository = createSupabaseLineWebhookRepository(),
  encryptionKey = lineConfigEncryptionKey
): Promise<IngestLineWebhookResult> {
  if (!encryptionKey) {
    throw new Error("LINE_CONFIG_ENCRYPTION_KEY is not configured");
  }

  const candidates = await repository.listVerificationCandidates();
  const matchedChannel = findVerifiedChannel(input.body, input.signature, candidates, encryptionKey);

  if (!matchedChannel) {
    throw new LineWebhookSignatureError();
  }

  const payload = parseWebhookPayload(input.body);
  let activeAgentId: string | null = null;
  let acceptedMessages = 0;
  let skippedEvents = 0;
  let duplicateEvents = 0;
  let enqueuedJobs = 0;

  for (const event of payload.events) {
    const providerEventId = buildProviderEventId(event);
    const existingEvent = await repository.findWebhookEvent(providerEventId);

    if (existingEvent) {
      duplicateEvents += 1;
      continue;
    }

    await repository.insertWebhookEvent({
      tenantId: matchedChannel.tenantId,
      channelId: matchedChannel.channelId,
      providerEventId,
      eventType: event.type,
      payload: {
        destination: payload.destination ?? null,
        event
      }
    });

    if (!isTextMessageEvent(event)) {
      skippedEvents += 1;
      continue;
    }

    const externalUserId = getExternalUserId(event.source);
    if (!externalUserId) {
      skippedEvents += 1;
      continue;
    }

    const messageTimestamp = new Date(event.timestamp).toISOString();
    const contact = await repository.upsertContact({
      tenantId: matchedChannel.tenantId,
      channelId: matchedChannel.channelId,
      externalUserId,
      lastSeenAt: messageTimestamp
    });

    let conversation = await repository.findOpenConversation({
      tenantId: matchedChannel.tenantId,
      channelId: matchedChannel.channelId,
      contactId: contact.id
    });

    if (!conversation) {
      activeAgentId ??= await repository.getActiveAgentId(matchedChannel.tenantId);
      conversation = await repository.createConversation({
        tenantId: matchedChannel.tenantId,
        channelId: matchedChannel.channelId,
        contactId: contact.id,
        agentId: activeAgentId,
        openedAt: messageTimestamp,
        lastMessageAt: messageTimestamp
      });
    } else {
      await repository.updateConversationLastMessage({
        tenantId: matchedChannel.tenantId,
        conversationId: conversation.id,
        lastMessageAt: messageTimestamp
      });
    }

    const existingMessage = await repository.findMessageByExternalId({
      tenantId: matchedChannel.tenantId,
      externalMessageId: event.message.id
    });

    let message: MessageRecord;
    if (existingMessage) {
      message = {
        id: existingMessage.id,
        created: false
      };
    } else {
      const createdMessage = await repository.insertInboundMessage({
        tenantId: matchedChannel.tenantId,
        conversationId: conversation.id,
        externalMessageId: event.message.id,
        content: event.message.text,
        metadata: {
          replyToken: event.replyToken ?? null,
          webhookEventId: event.webhookEventId ?? null,
          source: event.source,
          isRedelivery: event.deliveryContext?.isRedelivery ?? false
        }
      });

      message = {
        id: createdMessage.id,
        created: true
      };
    }

    acceptedMessages += 1;

    if (message.created) {
      await repository.enqueueMessageJob({
        tenantId: matchedChannel.tenantId,
        conversationId: conversation.id,
        messageId: message.id
      });
      enqueuedJobs += 1;
    }
  }

  return {
    tenantId: matchedChannel.tenantId,
    channelId: matchedChannel.channelId,
    receivedEvents: payload.events.length,
    acceptedMessages,
    skippedEvents,
    duplicateEvents,
    enqueuedJobs
  };
}

export function createSupabaseLineWebhookRepository(): LineWebhookRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async listVerificationCandidates() {
      const { data, error } = await admin
        .from("line_channel_configs")
        .select("tenant_id, channel_id, channel_secret_ciphertext");

      if (error) {
        throw error;
      }

      return data.map((row) => ({
        tenantId: row.tenant_id,
        channelId: row.channel_id,
        channelSecretCiphertext: row.channel_secret_ciphertext
      }));
    },

    async findWebhookEvent(providerEventId) {
      const { data, error } = await admin
        .from("webhook_events")
        .select("id")
        .eq("provider", "line")
        .eq("provider_event_id", providerEventId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },

    async insertWebhookEvent(input) {
      const { error } = await admin.from("webhook_events").insert({
        tenant_id: input.tenantId,
        channel_id: input.channelId,
        provider: "line",
        provider_event_id: input.providerEventId,
        event_type: input.eventType,
        payload: input.payload
      });

      if (error) {
        throw error;
      }
    },

    async getActiveAgentId(tenantId) {
      const { data, error } = await admin
        .from("agents")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

      if (error) {
        throw error;
      }

      return data.id;
    },

    async upsertContact(input) {
      const { data, error } = await admin
        .from("contacts")
        .upsert(
          {
            tenant_id: input.tenantId,
            channel_id: input.channelId,
            external_user_id: input.externalUserId,
            last_seen_at: input.lastSeenAt
          },
          {
            onConflict: "channel_id,external_user_id"
          }
        )
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async findOpenConversation(input) {
      const { data, error } = await admin
        .from("conversations")
        .select("id")
        .eq("tenant_id", input.tenantId)
        .eq("channel_id", input.channelId)
        .eq("contact_id", input.contactId)
        .in("status", ["bot_active", "handoff_requested", "human_active"])
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },

    async createConversation(input) {
      const { data, error } = await admin
        .from("conversations")
        .insert({
          tenant_id: input.tenantId,
          channel_id: input.channelId,
          contact_id: input.contactId,
          agent_id: input.agentId,
          status: "bot_active",
          opened_at: input.openedAt,
          last_message_at: input.lastMessageAt
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
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
    },

    async findMessageByExternalId(input) {
      const { data, error } = await admin
        .from("messages")
        .select("id")
        .eq("tenant_id", input.tenantId)
        .eq("source", "line_webhook")
        .eq("external_message_id", input.externalMessageId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },

    async insertInboundMessage(input) {
      const { data, error } = await admin
        .from("messages")
        .insert({
          tenant_id: input.tenantId,
          conversation_id: input.conversationId,
          external_message_id: input.externalMessageId,
          role: "user",
          source: "line_webhook",
          content: input.content,
          metadata: input.metadata
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async enqueueMessageJob(input) {
      const { error } = await admin
        .from("message_jobs")
        .upsert(
          {
            tenant_id: input.tenantId,
            conversation_id: input.conversationId,
            message_id: input.messageId,
            job_type: "process_incoming_message",
            status: "queued"
          },
          {
            onConflict: "message_id"
          }
        );

      if (error) {
        throw error;
      }
    }
  };
}

function parseWebhookPayload(body: string): LineWebhookPayload {
  const parsed = JSON.parse(body) as unknown;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("events" in parsed) ||
    !Array.isArray((parsed as { events?: unknown }).events)
  ) {
    throw new LineWebhookPayloadError();
  }

  return parsed as LineWebhookPayload;
}

function findVerifiedChannel(
  body: string,
  signature: string | null | undefined,
  candidates: VerificationCandidate[],
  encryptionKey: string
) {
  for (const candidate of candidates) {
    const channelSecret = decryptSecret(candidate.channelSecretCiphertext, encryptionKey);

    if (verifyLineSignature(body, signature, channelSecret)) {
      return candidate;
    }
  }

  return null;
}

function isTextMessageEvent(event: LineWebhookEvent): event is LineTextMessageEvent {
  return event.type === "message" && "message" in event && event.message?.type === "text";
}

function buildProviderEventId(event: LineWebhookEvent) {
  if (event.webhookEventId) {
    return event.webhookEventId;
  }

  const sourceId =
    event.source && "userId" in event.source
      ? event.source.userId ?? event.source.groupId ?? event.source.roomId ?? "unknown"
      : "unknown";
  const messageId =
    "message" in event && event.message && "id" in event.message && event.message.id
      ? event.message.id
      : "no-message";

  return [event.type, event.timestamp, sourceId, messageId].join(":");
}

function getExternalUserId(source: LineWebhookSource) {
  return source.userId ?? source.groupId ?? source.roomId ?? null;
}
