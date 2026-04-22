import {
  AuthError,
  requireTenantScopedUser,
  requirePlatformAdmin,
  type TenantScopedUser
} from "@/lib/auth/guards";
import { fail } from "@/server/dto/api-response";

export async function runTenantScopedRoute(
  handler: (user: TenantScopedUser) => Promise<Response>,
  requireUser: () => Promise<TenantScopedUser> = requireTenantScopedUser
) {
  try {
    const user = await requireUser();
    return await handler(user);
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.status);
    }

    throw error;
  }
}

export async function runPlatformAdminRoute(handler: () => Promise<Response>) {
  try {
    await requirePlatformAdmin();
    return await handler();
  } catch (error) {
    if (error instanceof AuthError) {
      return fail(error.code, error.message, error.status);
    }

    throw error;
  }
}
