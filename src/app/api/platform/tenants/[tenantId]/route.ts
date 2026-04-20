import { z } from "zod";
import { AuthError, requirePlatformAdmin } from "@/lib/auth/guards";
import { fail, ok } from "@/server/dto/api-response";
import { getPlatformTenant } from "@/server/domain/tenant/platform-tenants";

const schema = z.object({
  status: z.string().optional(),
  planCode: z.string().optional()
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.status);
    }

    throw error;
  }

  const { tenantId } = await params;
  return ok({ tenant: await getPlatformTenant(tenantId) });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.status);
    }

    throw error;
  }

  const { tenantId } = await params;
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);

  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "invalid tenant patch payload");
  }

  const tenant = await getPlatformTenant(tenantId);
  return ok({
    tenant: {
      ...tenant,
      status: parsed.data.status ?? tenant.status,
      plan: parsed.data.planCode ?? tenant.plan
    }
  });
}
