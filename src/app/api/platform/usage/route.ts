import { AuthError, requirePlatformAdmin } from "@/lib/auth/guards";
import { fail, ok } from "@/server/dto/api-response";
import { getUsageReport } from "@/server/domain/billing/get-usage";

export async function GET() {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.status);
    }

    throw error;
  }

  return ok(await getUsageReport());
}
