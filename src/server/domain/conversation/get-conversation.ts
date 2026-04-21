import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ConversationMessage = {
  id: string;
  role: string;
  source: string;
  content: string;
  createdAt: string;
};

export type ConversationDetail = {
  id: string;
  status: string;
  openedAt: string;
  lastMessageAt: string | null;
  handoffRequestedAt: string | null;
  humanActivatedAt: string | null;
  scenarioId: string | null;
  contact: {
    id: string;
    displayName: string;
    externalUserId: string;
  };
  messages: ConversationMessage[];
};

type ConversationRow = {
  id: string;
  status: string;
  opened_at: string;
  last_message_at: string | null;
  handoff_requested_at: string | null;
  human_activated_at: string | null;
  scenario_id: string | null;
  contact:
    | {
        id: string;
        display_name: string | null;
        external_user_id: string;
      }
    | Array<{
        id: string;
        display_name: string | null;
        external_user_id: string;
      }>;
};

type MessageRow = {
  id: string;
  role: string;
  source: string;
  content: string;
  created_at: string;
};

export type GetConversationRepository = {
  getConversationRow(tenantId: string, conversationId: string): Promise<ConversationRow>;
  listConversationMessages(tenantId: string, conversationId: string): Promise<MessageRow[]>;
};

export async function getConversation(
  tenantId: string,
  conversationId: string,
  repository: GetConversationRepository = createSupabaseGetConversationRepository()
) {
  const row = await repository.getConversationRow(tenantId, conversationId);
  const contact = normalizeContact(row.contact);
  const messages = await repository.listConversationMessages(tenantId, conversationId);

  return {
    conversation: {
      id: row.id,
      status: row.status,
      openedAt: row.opened_at,
      lastMessageAt: row.last_message_at,
      handoffRequestedAt: row.handoff_requested_at,
      humanActivatedAt: row.human_activated_at,
      scenarioId: row.scenario_id,
      contact: {
        id: contact.id,
        displayName: contact.display_name ?? contact.external_user_id,
        externalUserId: contact.external_user_id
      },
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        source: message.source,
        content: message.content,
        createdAt: message.created_at
      }))
    }
  };
}

export function createSupabaseGetConversationRepository(): GetConversationRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async getConversationRow(tenantId, conversationId) {
      const { data, error } = await admin
        .from("conversations")
        .select(
          [
            "id",
            "status",
            "opened_at",
            "last_message_at",
            "handoff_requested_at",
            "human_activated_at",
            "scenario_id",
            "contact:contacts!inner(id, display_name, external_user_id)"
          ].join(", ")
        )
        .eq("tenant_id", tenantId)
        .eq("id", conversationId)
        .single();

      if (error) {
        throw error;
      }

      return data as unknown as ConversationRow;
    },

    async listConversationMessages(tenantId, conversationId) {
      const { data, error } = await admin
        .from("messages")
        .select("id, role, source, content, created_at")
        .eq("tenant_id", tenantId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      return data as unknown as MessageRow[];
    }
  };
}

function normalizeContact(row: ConversationRow["contact"]) {
  return Array.isArray(row) ? row[0] : row;
}
