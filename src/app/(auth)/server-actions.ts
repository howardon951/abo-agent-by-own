"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { resolvePostSignInPath, resolvePostSignUpFlow } from "@/lib/auth/auth-flow";

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirectWithMessage("/login", "Email 與密碼必填");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirectWithMessage("/login", "Supabase 環境變數尚未配置");
  }

  const {
    data: { user },
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectWithMessage("/login", error.message);
  }

  if (!user) {
    redirect("/dashboard");
  }

  const admin = createAdminSupabaseClient();
  if (!admin) {
    redirect("/dashboard");
  }

  const path = await resolvePostSignInPath(user.id, {
    async findTenantMembership(userId) {
      const { data } = await admin
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      return data?.tenant_id ? { tenantId: data.tenant_id } : null;
    }
  });

  redirect(path);
}

export async function signUpAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const slug = String(formData.get("slug") ?? "");

  if (!email || !password) {
    redirectWithMessage("/signup", "Email 與密碼必填");
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    redirectWithMessage("/signup", "Supabase 環境變數尚未配置");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`,
      data: {
        display_name: name,
        tenant_slug: slug
      }
    }
  });

  if (error) {
    redirectWithMessage("/signup", error.message);
  }

  const nextStep = resolvePostSignUpFlow(Boolean(data.session));

  if (nextStep.message) {
    redirectWithMessage(nextStep.redirectPath, nextStep.message);
  }

  redirect(nextStep.redirectPath);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  if (supabase) {
    await supabase.auth.signOut({
      scope: "local"
    });
  }

  redirect("/login");
}
