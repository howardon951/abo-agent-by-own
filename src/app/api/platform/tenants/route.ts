import { z } from "zod";
import { fail, ok } from "@/server/dto/api-response";
import { listPlatformTenants, getPlatformTenant } from "@/server/domain/tenant/platform-tenants";

const schema = z.object({
  tenantName: z.string().min(1),
  slug: z.string().min(1),
  ownerEmail: z.string().email(),
  planCode: z.string().min(1)
});

export async function GET() {
  return ok({ tenants: await listPlatformTenants() });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "invalid tenant payload");
  }

  const tenant = await getPlatformTenant("tenant-demo");
  return ok({
    tenant: {
      ...tenant,
      name: parsed.data.tenantName,
      slug: parsed.data.slug,
      ownerEmail: parsed.data.ownerEmail,
      plan: parsed.data.planCode
    }
  });
}
