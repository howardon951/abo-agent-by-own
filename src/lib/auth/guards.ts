import { getSessionUser } from "@/lib/auth/session";

export async function requireTenantOwner() {
  const user = await getSessionUser();
  if (!user || (user.role !== "tenant_owner" && user.role !== "platform_admin")) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function requirePlatformAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "platform_admin") {
    throw new Error("Forbidden");
  }
  return user;
}
