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
      <PageSection
        title="Overview"
        description="先看目前 bot 是否已具備上線條件，再決定下一步要補 Launch、Behavior 還是 Inbox。"
      >
        <div className="panel card">
          <div className="stack" style={{ gap: 8 }}>
            <span className="app-sidebar-label">Workspace Summary</span>
            <strong style={{ fontSize: 24 }}>{user.tenantId ?? "-"}</strong>
            <p style={{ marginBottom: 0, color: "var(--muted)" }}>
              你正在管理這個 tenant 的 LINE AI 助手。先確認 LINE 已連、知識庫已建立，再回頭調整
              Agent 與 Scenarios。
            </p>
          </div>
        </div>
        <div className="panel card stack" style={{ gap: 12 }}>
          <strong>Next Actions</strong>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/line" className="button button-primary">
              Connect LINE
            </Link>
            <Link href="/knowledge/new" className="button button-secondary">
              Add Knowledge
            </Link>
            <Link href="/agent" className="button button-secondary">
              Tune Agent
            </Link>
            <Link href="/conversations" className="button button-secondary">
              Review Inbox
            </Link>
          </div>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>
            導覽已改成 Launch / Behavior / Inbox，讓商家可以順著上線流程操作。
          </span>
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
      <section className="grid-2">
        <div className="panel card stack">
          <span className="app-sidebar-label">Launch Checklist</span>
          <strong>Go-Live Readiness</strong>
          <div className="stack" style={{ gap: 10 }}>
            <ChecklistItem
              done={knowledgeDocuments.documents.length > 0}
              title="Knowledge Base"
              description="至少建立一份 FAQ / URL 文件，讓回覆不是空白 bot。"
            />
            <ChecklistItem
              done={conversations.items.length > 0}
              title="Inbox Tracking"
              description="已開始累積真實對話，後台可觀察人工接手與 bot reply。"
            />
            <ChecklistItem
              done={openHandoffs >= 0}
              title="Handoff Flow"
              description="對話 detail 已可 Resume AI，human_active 流程已成立。"
            />
          </div>
        </div>
        <div className="panel card stack">
          <span className="app-sidebar-label">What This Console Covers</span>
          <strong>Operations Scope</strong>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            這個商家後台主要負責三件事：上線 LINE、配置回覆邏輯、處理人工接手中的對話。複雜
            debug 與平台級報表仍放在後續頁面。
          </p>
        </div>
      </section>
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

function ChecklistItem({
  done,
  title,
  description
}: {
  done: boolean;
  title: string;
  description: string;
}) {
  return (
    <div
      className="panel card"
      style={{
        borderColor: done
          ? "color-mix(in srgb, var(--success) 35%, var(--border))"
          : "var(--border)"
      }}
    >
      <div className="stack" style={{ gap: 6 }}>
        <strong>
          {done ? "Ready" : "Pending"} / {title}
        </strong>
        <span style={{ color: "var(--muted)", fontSize: 14 }}>{description}</span>
      </div>
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
