import { logInfo } from "@/lib/utils/logger";

class LineClient {
  async replyText(input: { channelAccessToken: string; replyToken: string; text: string }) {
    const response = await fetch("https://api.line.me/v2/bot/message/reply", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${input.channelAccessToken}`
      },
      body: JSON.stringify({
        replyToken: input.replyToken,
        messages: [
          {
            type: "text",
            text: input.text
          }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`LINE reply failed: ${response.status} ${detail}`.trim());
    }

    logInfo("line reply text", {
      replyTokenSuffix: input.replyToken.slice(-6),
      textLength: input.text.length
    });
    return { ok: true as const };
  }
}

export const lineClient = new LineClient();
