import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ConversationListItem = {
  id: string;
  status: string;
  contactDisplayName: string;
  lastMessageAt: string | null;
  lastMessageSnippet: string | null;
};

type ConversationRow = {
  id: string;
  status: string;
  last_message_at: string | null;
  contact:
    | {
        display_name: string | null;
        external_user_id: string;
      }
    | Array<{
        display_name: string | null;
        external_user_id: string;
      }>;
};

type MessageRow = {
  conversation_id: string;
  content: string;
  created_at: string;
};

export type ListConversationsRepository = {
  listConversationRows(tenantId: string): Promise<ConversationRow[]>;
  listLatestMessages(tenantId: string, conversationIds: string[]): Promise<MessageRow[]>;
};

export async function listConversations(
  tenantId: string,
  repository: ListConversationsRepository = createSupabaseListConversationsRepository()
) {
  const rows = await repository.listConversationRows(tenantId);
  const latestMessages =
    rows.length > 0 ? await repository.listLatestMessages(tenantId, rows.map((row) => row.id)) : [];
  const latestMessageByConversationId = new Map(
    latestMessages.map((message) => [message.conversation_id, message])
  );

  return {
    items: rows.map((row) => {
      const contact = normalizeContact(row.contact);
      const latestMessage = latestMessageByConversationId.get(row.id);

      return {
        id: row.id,
        status: row.status,
        contactDisplayName: contact.display_name ?? contact.external_user_id,
        lastMessageAt: row.last_message_at ?? latestMessage?.created_at ?? null,
        lastMessageSnippet: latestMessage?.content ?? null
      };
    }),
    nextCursor: null
  };
}

export function createSupabaseListConversationsRepository(): ListConversationsRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async listConversationRows(tenantId) {
      const { data, error } = await admin
        .from("conversations")
        .select(
          "id, status, last_message_at, contact:contacts!inner(display_name, external_user_id)"
        )
        .eq("tenant_id", tenantId)
        .order("last_message_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      return data as unknown as ConversationRow[];
    },

    async listLatestMessages(tenantId, conversationIds) {
      const { data, error } = await admin
        .from("messages")
        .select("conversation_id, content, created_at")
        .eq("tenant_id", tenantId)
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      const latestByConversationId = new Map<string, MessageRow>();
      for (const row of data as unknown as MessageRow[]) {
        if (!latestByConversationId.has(row.conversation_id)) {
          latestByConversationId.set(row.conversation_id, row);
        }
      }

      return Array.from(latestByConversationId.values());
    }
  };
}

function normalizeContact(row: ConversationRow["contact"]) {
  return Array.isArray(row) ? row[0] : row;
}
