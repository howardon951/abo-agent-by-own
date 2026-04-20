import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { getCurrentAgent, updateCurrentAgent } from "@/server/domain/agent/get-current-agent";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

const patchSchema = z.object({
  name: z.string().optional(),
  brandName: z.string().optional(),
  brandTone: z.string().optional(),
  forbiddenTopics: z.array(z.string()).optional(),
  fallbackPolicy: z.string().optional()
});

export async function GET() {
  return runTenantScopedRoute(async (user) => {
    return ok(await getCurrentAgent(user.tenantId));
  });
}

export async function PATCH(request: Request) {
  return runTenantScopedRoute(async (user) => {
    const json = await request.json().catch(() => null);
    const parsed = patchSchema.safeParse(json);

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "invalid agent payload");
    }

    return ok(await updateCurrentAgent(user.tenantId, parsed.data));
  });
}
