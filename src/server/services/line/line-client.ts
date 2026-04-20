import { logInfo } from "@/lib/utils/logger";

class LineClient {
  async replyText(input: { replyToken: string; text: string }) {
    logInfo("line reply text", input);
    return { ok: true };
  }
}

export const lineClient = new LineClient();
