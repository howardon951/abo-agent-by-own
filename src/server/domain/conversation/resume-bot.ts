import { requireAdminClient } from "@/lib/supabase/admin";

export type ResumeConversationBotRepository = {
  resumeConversation(tenantId: string, conversationId: string): Promise<{
    id: string;
    status: string;
  }>;
};

export async function resumeConversationBot(
  tenantId: string,
  conversationId: string,
  repository: ResumeConversationBotRepository = createRepository()
) {
  return repository.resumeConversation(tenantId, conversationId);
}

function createRepository(): ResumeConversationBotRepository {
  const admin = requireAdminClient();

  return {
    async resumeConversation(tenantId, conversationId) {
      const { data, error } = await admin
        .from("conversations")
        .update({ status: "bot_active" })
        .eq("tenant_id", tenantId)
        .eq("id", conversationId)
        .select("id, status")
        .single();

      if (error) {
        throw error;
      }

      return data;
    }
  };
}
