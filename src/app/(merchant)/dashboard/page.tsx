import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

const rows = [
  {
    contact: "LINE User A",
    status: "bot_active",
    lastMessage: "今天營業到幾點？",
    updatedAt: "13:00"
  },
  {
    contact: "LINE User B",
    status: "human_active",
    lastMessage: "我要退貨",
    updatedAt: "13:05"
  }
];

export default async function MerchantDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "tenant_owner" && !user.tenantId) {
    redirect("/setup");
  }

  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Merchant Dashboard" description="商家後台總覽。">
        <div className="panel card">
          <strong>Current session</strong>
          <p style={{ marginBottom: 0, color: "var(--muted)" }}>
            {user
              ? `${user.email} / role=${user.role} / tenant=${user.tenantId ?? "-"}`
              : "尚未登入或尚未配置 Supabase session"}
          </p>
        </div>
        <div className="grid-3">
          <StatCard label="Messages Today" value="42" hint="LINE webhook -> runtime" />
          <StatCard label="Open Handoffs" value="2" hint="需要人工接手" />
          <StatCard label="Knowledge Docs" value="6" hint="FAQ / PDF / URL" />
        </div>
      </PageSection>
      <DataTable
        columns={[
          { key: "contact", label: "Contact" },
          { key: "status", label: "Status" },
          { key: "lastMessage", label: "Last Message" },
          { key: "updatedAt", label: "Updated" }
        ]}
        rows={rows}
      />
    </div>
  );
}
