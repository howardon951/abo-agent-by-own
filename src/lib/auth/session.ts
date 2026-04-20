import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  role: "platform_admin" | "tenant_owner";
  tenantId?: string;
};

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

  const [{ data: platformAdmin }, { data: tenantMember }] = await Promise.all([
    admin.from("platform_admins").select("user_id").eq("user_id", user.id).maybeSingle(),
    admin
      .from("tenant_members")
      .select("tenant_id, role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
  ]);

  if (platformAdmin) {
    return {
      id: user.id,
      email: user.email,
      role: "platform_admin",
      tenantId: tenantMember?.tenant_id
    };
  }

  return {
    id: user.id,
    email: user.email,
    role: "tenant_owner",
    tenantId: tenantMember?.tenant_id
  };
}
