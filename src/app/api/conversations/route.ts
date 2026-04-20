import { ok } from "@/server/dto/api-response";
import { listConversations } from "@/server/domain/conversation/list-conversations";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

export async function GET() {
  return runTenantScopedRoute(async () => ok(await listConversations()));
}
