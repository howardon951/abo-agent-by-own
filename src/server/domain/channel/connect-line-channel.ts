export async function connectLineChannel(input: {
  name: string;
  channelIdExternal?: string;
  channelSecret: string;
  channelAccessToken: string;
}) {
  return {
    channel: {
      id: "line-channel-main",
      provider: "line",
      name: input.name,
      channelIdExternal: input.channelIdExternal ?? null,
      status: "connected",
      webhookUrl: "http://localhost:3000/api/webhooks/line"
    }
  };
}
