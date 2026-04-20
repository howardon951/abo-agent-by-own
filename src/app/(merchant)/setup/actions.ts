"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { setupTenant } from "@/server/domain/tenant/setup-tenant";

const schema = z.object({
  tenantName: z.string().min(1, "商家名稱必填"),
  slug: z
    .string()
    .min(1, "Slug 必填")
    .regex(/^[a-z0-9-]+$/, "Slug 只能使用小寫英數與連字號")
});

function redirectWithMessage(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function completeTenantSetupAction(formData: FormData) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  if (user.tenantId) {
    redirect("/dashboard");
  }

  const parsed = schema.safeParse({
    tenantName: String(formData.get("tenantName") ?? ""),
    slug: String(formData.get("slug") ?? "")
  });

  if (!parsed.success) {
    redirectWithMessage("/setup", parsed.error.issues[0]?.message ?? "資料格式錯誤");
  }

  try {
    await setupTenant({
      userId: user.id,
      tenantName: parsed.data.tenantName,
      slug: parsed.data.slug
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "建立商家失敗";
    redirectWithMessage("/setup", message);
  }

  redirect("/dashboard");
}
