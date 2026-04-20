import { processIncomingMessage } from "@/server/domain/runtime/process-incoming-message";
import { claimNextJob } from "@/server/services/jobs/claim-job";

export async function processMessageJob() {
  const job = await claimNextJob();
  if (!job) {
    return { status: "idle" as const };
  }

  return processIncomingMessage({
    channelId: job.channelId,
    externalUserId: job.externalUserId,
    message: job.message
  });
}
