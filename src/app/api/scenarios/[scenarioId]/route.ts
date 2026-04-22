import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { updateScenario } from "@/server/domain/scenario/list-scenarios";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

const schema = z.object({
  name: z.string().optional(),
  routingKeywords: z.array(z.string()).optional(),
  promptConfig: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional()
});

type PatchScenarioRouteDeps = {
  runTenantScopedRoute: typeof runTenantScopedRoute;
  updateScenario: typeof updateScenario;
};

export async function patchScenarioRoute(
  request: Request,
  params: Promise<{ scenarioId: string }>,
  deps: PatchScenarioRouteDeps = {
    runTenantScopedRoute,
    updateScenario
  }
) {
  const { runTenantScopedRoute, updateScenario } = deps;

  return runTenantScopedRoute(async (user) => {
    const { scenarioId } = await params;
    const json = await request.json().catch(() => null);
    const parsed = schema.safeParse(json);

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "invalid scenario payload");
    }

    return ok({ scenario: await updateScenario(user.tenantId, scenarioId, parsed.data) });
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  return patchScenarioRoute(request, params);
}
