import { ok } from "@/server/dto/api-response";
import { getUsageReport } from "@/server/domain/billing/get-usage";
import { runPlatformAdminRoute } from "@/server/http/tenant-route";

export async function GET() {
  return runPlatformAdminRoute(async () => {
    return ok(await getUsageReport());
  });
}
