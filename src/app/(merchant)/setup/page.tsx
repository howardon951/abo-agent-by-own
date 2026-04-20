import { redirect } from "next/navigation";
import { PageSection } from "@/components/layout/page-section";
import { getSessionUser } from "@/lib/auth/session";
import { completeTenantSetupAction } from "@/app/(merchant)/setup/actions";

export default async function SetupPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.tenantId) {
    redirect("/dashboard");
  }

  return (
    <PageSection
      title="Tenant Setup"
      description="第一次登入後，先建立你的商家工作區。這一步會初始化 tenant、agent、知識庫與預設情境。"
    >
      <div className="panel card stack">
        <div className="panel card">
          <strong>Current user</strong>
          <p style={{ marginBottom: 0, color: "var(--muted)" }}>{user.email}</p>
        </div>
        {params.message ? (
          <div className="panel card" style={{ color: "var(--danger)" }}>
            {params.message}
          </div>
        ) : null}
        <form action={completeTenantSetupAction} className="stack">
          <div className="field">
            <label htmlFor="tenantName">商家名稱</label>
            <input id="tenantName" name="tenantName" placeholder="Abo Coffee" />
          </div>
          <div className="field">
            <label htmlFor="slug">網址代號</label>
            <input id="slug" name="slug" placeholder="abo-coffee" />
          </div>
          <button className="button button-primary" type="submit">
            建立商家工作區
          </button>
        </form>
      </div>
    </PageSection>
  );
}
