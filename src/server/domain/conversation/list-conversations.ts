import { requireAdminClient } from "@/lib/supabase/admin";
import { normalizeJoin } from "@/lib/supabase/normalize";

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
    | { display_name: string | null; external_user_id: string }
    | Array<{ display_name: string | null; external_user_id: string }>;
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
  repository: ListConversationsRepository = createRepository()
) {
  const rows = await repository.listConversationRows(tenantId);
  const latestMessages =
    rows.length > 0
      ? await repository.listLatestMessages(
          tenantId,
          rows.map((row) => row.id)
        )
      : [];

  const latestByConversation = new Map(latestMessages.map((m) => [m.conversation_id, m]));

  return {
    items: rows.map((row) => {
      const contact = normalizeJoin(row.contact);
      const latest = latestByConversation.get(row.id);

      return {
        id: row.id,
        status: row.status,
        contactDisplayName: contact.display_name ?? contact.external_user_id,
        lastMessageAt: row.last_message_at ?? latest?.created_at ?? null,
        lastMessageSnippet: latest?.content ?? null
      };
    }),
    nextCursor: null
  };
}

function createRepository(): ListConversationsRepository {
  const admin = requireAdminClient();

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

      const latestByConversation = new Map<string, MessageRow>();
      for (const row of data as unknown as MessageRow[]) {
        if (!latestByConversation.has(row.conversation_id)) {
          latestByConversation.set(row.conversation_id, row);
        }
      }

      return Array.from(latestByConversation.values());
    }
  };
}
