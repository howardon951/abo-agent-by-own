import { ok } from "@/server/dto/api-response";
import { resumeConversationBot } from "@/server/domain/conversation/resume-bot";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  return runTenantScopedRoute(async (user) => {
    const { conversationId } = await params;
    return ok(await resumeConversationBot(user.tenantId, conversationId));
  });
}
