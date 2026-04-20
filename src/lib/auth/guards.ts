import { redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

export type TenantScopedUser = SessionUser & {
  tenantId: string;
};

export class AuthError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN";
  status: number;

  constructor(code: "UNAUTHORIZED" | "FORBIDDEN", message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.code = code;
    this.status = status;
  }
}

export function isTenantOwner(user: SessionUser | null): user is SessionUser {
  return !!user && (user.role === "tenant_owner" || user.role === "platform_admin");
}

export function getTenantRedirectPath(user: SessionUser) {
  return user.tenantId ? "/dashboard" : "/setup";
}

export function ensureTenantOwnerUser(user: SessionUser | null) {
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "login required", 401);
  }

  if (!isTenantOwner(user)) {
    throw new AuthError("FORBIDDEN", "forbidden", 403);
  }

  return user;
}

export function ensureTenantScopedUser(user: SessionUser | null): TenantScopedUser {
  const tenantUser = ensureTenantOwnerUser(user);

  if (!tenantUser.tenantId) {
    throw new AuthError("FORBIDDEN", "tenant context required", 403);
  }

  return tenantUser as TenantScopedUser;
}

export function ensurePlatformAdminUser(user: SessionUser | null) {
  if (!user) {
    throw new AuthError("UNAUTHORIZED", "login required", 401);
  }

  if (user.role !== "platform_admin") {
    throw new AuthError("FORBIDDEN", "forbidden", 403);
  }

  return user;
}

export async function requireTenantOwner() {
  return ensureTenantOwnerUser(await getSessionUser());
}

export async function requireTenantScopedUser() {
  return ensureTenantScopedUser(await getSessionUser());
}

export async function requirePlatformAdmin() {
  return ensurePlatformAdminUser(await getSessionUser());
}

export async function requirePlatformAdminPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "platform_admin") {
    redirect(getTenantRedirectPath(user));
  }

  return user;
}
