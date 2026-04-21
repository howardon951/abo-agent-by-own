import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";
import { DataTable } from "@/components/ui/data-table";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listConversations } from "@/server/domain/conversation/list-conversations";
import { listKnowledgeDocuments } from "@/server/domain/knowledge/list-documents";

export default async function MerchantDashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "tenant_owner" && !user.tenantId) {
    redirect("/setup");
  }

  const conversations = await listConversations(user.tenantId ?? "");
  const knowledgeDocuments = await listKnowledgeDocuments();
  const openHandoffs = conversations.items.filter((item) => item.status === "human_active").length;
  const dashboardRows = conversations.items.slice(0, 5).map((conversation) => ({
    contact: conversation.contactDisplayName,
    status: conversation.status,
    lastMessage: conversation.lastMessageSnippet ?? "-",
    updatedAt: formatDateTime(conversation.lastMessageAt)
  }));

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
        <div className="panel card stack" style={{ gap: 12 }}>
          <strong>Quick Access</strong>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/agent" className="button button-secondary">
              Agent Settings
            </Link>
            <Link href="/scenarios" className="button button-secondary">
              Scenario Rules
            </Link>
            <Link href="/knowledge" className="button button-secondary">
              Knowledge Base
            </Link>
            <Link href="/conversations" className="button button-secondary">
              Conversations
            </Link>
            <Link href="/line" className="button button-secondary">
              LINE Integration
            </Link>
            <Link href="/playground" className="button button-secondary">
              Playground
            </Link>
          </div>
        </div>
        <div className="grid-3">
          <StatCard
            label="Tracked Conversations"
            value={String(conversations.items.length)}
            hint="目前資料庫中的對話數"
          />
          <StatCard label="Open Handoffs" value={String(openHandoffs)} hint="需要人工接手" />
          <StatCard
            label="Knowledge Docs"
            value={String(knowledgeDocuments.documents.length)}
            hint="FAQ / PDF / URL"
          />
        </div>
      </PageSection>
      <DataTable
        columns={[
          { key: "contact", label: "Contact" },
          { key: "status", label: "Status" },
          { key: "lastMessage", label: "Last Message" },
          { key: "updatedAt", label: "Updated" }
        ]}
        rows={dashboardRows}
      />
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("zh-TW", {
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
