import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { updateScenario } from "@/server/domain/scenario/list-scenarios";

const schema = z.object({
  name: z.string().optional(),
  routingKeywords: z.array(z.string()).optional(),
  promptConfig: z.record(z.string(), z.unknown()).optional(),
  isEnabled: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  const { scenarioId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "invalid scenario payload");
  }

  return ok(await updateScenario(scenarioId, parsed.data));
}
