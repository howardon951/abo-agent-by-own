import { ok } from "@/server/dto/api-response";
import { resumeConversationBot } from "@/server/domain/conversation/resume-bot";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  return ok(await resumeConversationBot(conversationId));
}
