import { ok } from "@/server/dto/api-response";
import { getConversation } from "@/server/domain/conversation/get-conversation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await params;
  return ok(await getConversation(conversationId));
}
