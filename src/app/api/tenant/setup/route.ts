import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { setupTenant } from "@/server/domain/tenant/setup-tenant";

const schema = z.object({
  tenantName: z.string().min(1),
  slug: z.string().min(1)
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "tenantName and slug are required");
  }

  const data = await setupTenant(parsed.data);
  return ok(data);
}
