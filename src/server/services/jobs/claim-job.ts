export async function claimNextJob() {
  return {
    id: "job-demo",
    messageId: "msg-demo",
    channelId: "line-channel-main",
    externalUserId: "line-user-demo",
    message: "今天營業到幾點？"
  };
}
