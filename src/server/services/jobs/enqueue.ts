import { requireAdminClient } from "@/lib/supabase/admin";

export async function enqueueMessageJob(messageId: string) {
  const admin = requireAdminClient();

  const { data: message, error: messageError } = await admin
    .from("messages")
    .select("id, tenant_id, conversation_id")
    .eq("id", messageId)
    .single();

  if (messageError) {
    throw messageError;
  }

  const { data, error } = await admin
    .from("message_jobs")
    .upsert(
      {
        tenant_id: message.tenant_id,
        conversation_id: message.conversation_id,
        message_id: message.id,
        job_type: "process_incoming_message",
        status: "queued"
      },
      {
        onConflict: "message_id"
      }
    )
    .select("id, status")
    .single();

  if (error) {
    throw error;
  }

  return {
    jobId: data.id,
    status: data.status
  };
}
