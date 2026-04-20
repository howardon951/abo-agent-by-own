import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { setupTenant } from "@/server/domain/tenant/setup-tenant";
import { getSessionUser } from "@/lib/auth/session";

const schema = z.object({
  tenantName: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/)
});

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return fail("UNAUTHORIZED", "login required", 401);
  }

  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "tenantName and slug are required");
  }

  try {
    const data = await setupTenant({
      userId: user.id,
      ...parsed.data
    });
    return ok(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "tenant setup failed";
    return fail("INTERNAL_ERROR", message, 500);
  }

}
