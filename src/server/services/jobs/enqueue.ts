export async function enqueueMessageJob(messageId: string) {
  return {
    jobId: `job-${messageId}`,
    status: "queued"
  };
}
