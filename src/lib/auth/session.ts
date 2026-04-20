import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  role: "platform_admin" | "tenant_owner";
  tenantId?: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type SessionUserRepository = {
  isPlatformAdmin(userId: string): Promise<boolean>;
  findTenantMembership(userId: string): Promise<{ tenantId?: string } | null>;
};

export async function resolveSessionUser(
  user: AuthenticatedUser,
  repository: SessionUserRepository
): Promise<SessionUser> {
  const [isPlatformAdmin, tenantMembership] = await Promise.all([
    repository.isPlatformAdmin(user.id),
    repository.findTenantMembership(user.id)
  ]);

  if (isPlatformAdmin) {
    return {
      id: user.id,
      email: user.email,
      role: "platform_admin",
      tenantId: tenantMembership?.tenantId
    };
  }

  return {
    id: user.id,
    email: user.email,
    role: "tenant_owner",
    tenantId: tenantMembership?.tenantId
  };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    return {
      id: user.id,
      email: user.email,
      role: "tenant_owner"
    };
  }

  return resolveSessionUser(
    {
      id: user.id,
      email: user.email
    },
    createSupabaseSessionUserRepository(admin)
  );
}

function createSupabaseSessionUserRepository(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>
): SessionUserRepository {
  return {
    async isPlatformAdmin(userId) {
      const { data, error } = await admin
        .from("platform_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return Boolean(data);
    },

    async findTenantMembership(userId) {
      const { data, error } = await admin
        .from("tenant_members")
        .select("tenant_id, role")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.tenant_id ? { tenantId: data.tenant_id } : null;
    }
  };
}
