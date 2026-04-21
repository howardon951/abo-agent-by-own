import { processIncomingMessage } from "@/server/domain/runtime/process-incoming-message";
import type { ClaimedMessageJob } from "@/server/services/jobs/claim-job";
import { claimNextJob, completeJob, failJob } from "@/server/services/jobs/claim-job";
import { logError, logInfo } from "@/lib/utils/logger";

type ProcessMessageJobDependencies = {
  claimNextJob: typeof claimNextJob;
  processIncomingMessage: typeof processIncomingMessage;
  completeJob: typeof completeJob;
  failJob: typeof failJob;
};

const defaultDependencies: ProcessMessageJobDependencies = {
  claimNextJob,
  processIncomingMessage,
  completeJob,
  failJob
};

export async function processMessageJob(
  dependencies: ProcessMessageJobDependencies = defaultDependencies
) {
  logInfo("worker polling message job");
  let job: ClaimedMessageJob | null = null;

  try {
    job = await dependencies.claimNextJob();
    if (!job) {
      logInfo("worker idle");
      return { status: "idle" as const };
    }

    logInfo("worker claimed message job", {
      jobId: job.id,
      messageId: job.messageId,
      channelId: job.channelId
    });

    const result = await dependencies.processIncomingMessage({
      tenantId: job.tenantId,
      channelId: job.channelId,
      externalUserId: job.externalUserId,
      message: job.message,
      replyToken: job.replyToken
    });

    await dependencies.completeJob(job.id);

    logInfo("worker completed message job", {
      jobId: job.id,
      status: result.status
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retryable = !isNonRetryableJobError(message);
    logError("worker failed message job", {
      error: message,
      retryable
    });

    if (job) {
      await dependencies.failJob(job, message, { retryable });
    }

    throw error;
  }
}

function isNonRetryableJobError(message: string) {
  return message.includes("LINE reply failed: 400") && message.includes("Invalid reply token");
}
