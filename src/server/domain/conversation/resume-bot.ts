import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ResumeConversationBotRepository = {
  resumeConversation(tenantId: string, conversationId: string): Promise<{
    id: string;
    status: string;
  }>;
};

export async function resumeConversationBot(
  tenantId: string,
  conversationId: string,
  repository: ResumeConversationBotRepository = createSupabaseResumeConversationBotRepository()
) {
  return {
    conversation: await repository.resumeConversation(tenantId, conversationId)
  };
}

export function createSupabaseResumeConversationBotRepository(): ResumeConversationBotRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async resumeConversation(tenantId, conversationId) {
      const { data, error } = await admin
        .from("conversations")
        .update({
          status: "bot_active"
        })
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
