import { processIncomingMessage } from "@/server/domain/runtime/process-incoming-message";
import { claimNextJob } from "@/server/services/jobs/claim-job";
import { logError, logInfo } from "@/lib/utils/logger";

export async function processMessageJob() {
  logInfo("worker polling message job");

  try {
    const job = await claimNextJob();
    if (!job) {
      logInfo("worker idle");
      return { status: "idle" as const };
    }

    logInfo("worker claimed message job", {
      jobId: job.id,
      messageId: job.messageId,
      channelId: job.channelId
    });

    const result = await processIncomingMessage({
      channelId: job.channelId,
      externalUserId: job.externalUserId,
      message: job.message
    });

    logInfo("worker completed message job", {
      jobId: job.id,
      status: result.status
    });

    return result;
  } catch (error) {
    logError("worker failed message job", {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
