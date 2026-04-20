import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { processPlaygroundRun } from "@/server/domain/runtime/process-playground";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

const schema = z.object({
  input: z.string().min(1),
  scenarioHint: z.string().optional()
});

export async function POST(request: Request) {
  return runTenantScopedRoute(async () => {
    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "input is required");
    }

    return ok(await processPlaygroundRun(parsed.data));
  });
}
