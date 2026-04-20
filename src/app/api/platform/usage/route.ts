import { ok } from "@/server/dto/api-response";
import { getUsageReport } from "@/server/domain/billing/get-usage";

export async function GET() {
  return ok(await getUsageReport());
}
