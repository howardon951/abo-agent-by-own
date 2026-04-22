import { ok } from "@/server/dto/api-response";
import { getConversation } from "@/server/domain/conversation/get-conversation";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  return runTenantScopedRoute(async (user) => {
    const { conversationId } = await params;
    return ok({ conversation: await getConversation(user.tenantId, conversationId) });
  });
}
