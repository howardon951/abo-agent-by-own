import { ok } from "@/server/dto/api-response";
import { listScenarios } from "@/server/domain/scenario/list-scenarios";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

export async function GET() {
  return runTenantScopedRoute(async (user) => {
    return ok(await listScenarios(user.tenantId));
  });
}
