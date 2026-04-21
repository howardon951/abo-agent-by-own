import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ClaimedMessageJob = {
  id: string;
  tenantId: string;
  conversationId: string;
  messageId: string;
  retryCount: number;
  maxRetries: number;
  channelId: string;
  externalUserId: string;
  message: string;
  replyToken: string | null;
};

export type MessageJobRepository = {
  claimNextJob(workerId: string, leaseMs: number): Promise<ClaimedMessageJob | null>;
  markJobCompleted(jobId: string): Promise<void>;
  markJobFailed(
    jobId: string,
    input: { retryCount: number; maxRetries: number; error: string; retryable: boolean }
  ): Promise<void>;
};

export async function claimNextJob(
  repository: MessageJobRepository = createSupabaseMessageJobRepository(),
  workerId = `worker-${process.pid}`,
  leaseMs = 5 * 60 * 1000
) {
  return repository.claimNextJob(workerId, leaseMs);
}

export async function completeJob(
  jobId: string,
  repository: MessageJobRepository = createSupabaseMessageJobRepository()
) {
  await repository.markJobCompleted(jobId);
}

export async function failJob(
  job: Pick<ClaimedMessageJob, "id" | "retryCount" | "maxRetries">,
  error: string,
  options: { retryable?: boolean } = {},
  repository: MessageJobRepository = createSupabaseMessageJobRepository()
) {
  await repository.markJobFailed(job.id, {
    retryCount: job.retryCount,
    maxRetries: job.maxRetries,
    error,
    retryable: options.retryable ?? true
  });
}

export function createSupabaseMessageJobRepository(): MessageJobRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  return {
    async claimNextJob(workerId, leaseMs) {
      const now = new Date();
      const nowIso = now.toISOString();
      const leaseExpiresAt = new Date(now.getTime() + leaseMs).toISOString();

      const { data: candidate, error: candidateError } = await admin
        .from("message_jobs")
        .select("id, tenant_id, conversation_id, message_id, retry_count, max_retries")
        .eq("status", "queued")
        .lte("available_at", nowIso)
        .order("available_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (candidateError) {
        throw candidateError;
      }

      if (!candidate) {
        return null;
      }

      const { data: claimed, error: claimError } = await admin
        .from("message_jobs")
        .update({
          status: "processing",
          worker_id: workerId,
          locked_at: nowIso,
          lease_expires_at: leaseExpiresAt,
          last_error: null
        })
        .eq("id", candidate.id)
        .eq("status", "queued")
        .select("id, tenant_id, conversation_id, message_id, retry_count, max_retries")
        .maybeSingle();

      if (claimError) {
        throw claimError;
      }

      if (!claimed) {
        return null;
      }

      const { data: message, error: messageError } = await admin
        .from("messages")
        .select("content, metadata")
        .eq("tenant_id", claimed.tenant_id)
        .eq("id", claimed.message_id)
        .single();

      if (messageError) {
        throw messageError;
      }

      const { data: conversation, error: conversationError } = await admin
        .from("conversations")
        .select("channel_id, contact_id")
        .eq("tenant_id", claimed.tenant_id)
        .eq("id", claimed.conversation_id)
        .single();

      if (conversationError) {
        throw conversationError;
      }

      const { data: contact, error: contactError } = await admin
        .from("contacts")
        .select("external_user_id")
        .eq("tenant_id", claimed.tenant_id)
        .eq("id", conversation.contact_id)
        .single();

      if (contactError) {
        throw contactError;
      }

      const metadata =
        message.metadata && typeof message.metadata === "object"
          ? (message.metadata as Record<string, unknown>)
          : {};

      return {
        id: claimed.id,
        tenantId: claimed.tenant_id,
        conversationId: claimed.conversation_id,
        messageId: claimed.message_id,
        retryCount: claimed.retry_count,
        maxRetries: claimed.max_retries,
        channelId: conversation.channel_id,
        externalUserId: contact.external_user_id,
        message: message.content,
        replyToken: typeof metadata.replyToken === "string" ? metadata.replyToken : null
      };
    },

    async markJobCompleted(jobId) {
      const { error } = await admin
        .from("message_jobs")
        .update({
          status: "completed",
          finished_at: new Date().toISOString(),
          lease_expires_at: null
        })
        .eq("id", jobId);

      if (error) {
        throw error;
      }
    },

    async markJobFailed(jobId, input) {
      const nextRetryCount = input.retryCount + 1;
      const shouldDeadLetter = !input.retryable || nextRetryCount > input.maxRetries;
      const nextAvailableAt = new Date(Date.now() + Math.min(nextRetryCount, 5) * 60_000).toISOString();

      const { error } = await admin
        .from("message_jobs")
        .update({
          status: shouldDeadLetter ? "dead_letter" : "queued",
          retry_count: nextRetryCount,
          available_at: shouldDeadLetter ? undefined : nextAvailableAt,
          finished_at: shouldDeadLetter ? new Date().toISOString() : null,
          lease_expires_at: null,
          last_error: input.error
        })
        .eq("id", jobId);

      if (error) {
        throw error;
      }
    }
  };
}
