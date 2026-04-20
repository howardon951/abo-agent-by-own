import { ok } from "@/server/dto/api-response";
import { listScenarios } from "@/server/domain/scenario/list-scenarios";

export async function GET() {
  return ok(await listScenarios());
}
