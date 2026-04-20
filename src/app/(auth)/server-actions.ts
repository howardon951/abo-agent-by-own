"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirectWithMessage("/login", error.message);
  }

  redirect("/dashboard");
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

  if (!data.session) {
    redirectWithMessage("/login", "註冊成功，請先至信箱完成驗證後登入");
  }

  redirect("/dashboard");
}
