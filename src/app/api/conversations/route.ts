import { ok } from "@/server/dto/api-response";
import { listConversations } from "@/server/domain/conversation/list-conversations";

export async function GET() {
  return ok(await listConversations());
}
