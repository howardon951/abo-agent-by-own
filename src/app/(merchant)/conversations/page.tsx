import { PageSection } from "@/components/layout/page-section";
import { getSessionUser } from "@/lib/auth/session";
import { listConversations } from "@/server/domain/conversation/list-conversations";
import { redirect } from "next/navigation";
import { MerchantPageHero } from "@/components/merchant/merchant-page-hero";
import { getConversation } from "@/server/domain/conversation/get-conversation";
import Link from "next/link";
import { ConversationDetailPanel } from "@/components/merchant/conversation-detail-panel";

export default async function ConversationsPage({
  searchParams
}: {
  searchParams: Promise<{ conversationId?: string }>;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "tenant_owner" && !user.tenantId) {
    redirect("/setup");
  }

  if (!user.tenantId) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const data = await listConversations(user.tenantId);
  const selectedConversationId =
    params.conversationId && data.items.some((item) => item.id === params.conversationId)
      ? params.conversationId
      : data.items[0]?.id;
  const selectedConversation = selectedConversationId
    ? await getConversation(user.tenantId, selectedConversationId)
    : null;
  const handoffCount = data.items.filter((item) => item.status === "human_active").length;
  const botActiveCount = data.items.filter((item) => item.status === "bot_active").length;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Inbox" description="查看 bot_active 與 human_active 對話。">
        <MerchantPageHero
          eyebrow="Inbox"
          title="Operate conversations as an inbox, not a raw table"
          description="這頁把對話列表和 detail 放在同一個工作區，讓商家可以先掃描哪條對話需要看，再決定是否恢復 AI 或追查 handoff。"
          businessQuestion="商家最需要先知道：現在有哪些對話正在由 bot 處理，哪些已經需要人工接手？"
          actions={[
            { href: "/playground", label: "Test Replies", variant: "secondary" }
          ]}
          stats={[
            {
              label: "Tracked",
              value: String(data.items.length),
              hint: "目前資料庫中的對話總數"
            },
            {
              label: "Bot Active",
              value: String(botActiveCount),
              hint: "仍由 bot 自動處理中的對話"
            },
            {
              label: "Human Active",
              value: String(handoffCount),
              hint: "目前已轉由真人接手的對話"
            }
          ]}
        />
        <div className="inbox-layout">
          <aside className="panel card stack">
            <span className="app-sidebar-label">Conversation List</span>
            {data.items.length === 0 ? (
              <span style={{ color: "var(--muted)" }}>尚無對話紀錄。</span>
            ) : (
              data.items.map((conversation) => {
                const active = conversation.id === selectedConversationId;

                return (
                  <Link
                    key={conversation.id}
                    href={`/conversations?conversationId=${conversation.id}`}
                    className={active ? "inbox-item is-active" : "inbox-item"}
                  >
                    <strong>{conversation.contactDisplayName}</strong>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      {conversation.status}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      {conversation.lastMessageSnippet ?? "-"}
                    </span>
                  </Link>
                );
              })
            )}
          </aside>
          <div className="stack">
            {selectedConversation ? (
              <ConversationDetailPanel
                conversation={selectedConversation}
                showStandaloneLink
              />
            ) : (
              <div className="panel card">
                <span style={{ color: "var(--muted)" }}>
                  目前還沒有可顯示的對話。等 webhook 進來後，這裡會變成你的商家 inbox。
                </span>
              </div>
            )}
          </div>
        </div>
      </PageSection>
    </div>
  );
}
