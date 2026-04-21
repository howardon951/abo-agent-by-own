import Link from "next/link";
import type { ConversationDetail } from "@/server/domain/conversation/get-conversation";
import { ResumeBotButton } from "@/components/merchant/resume-bot-button";

export function ConversationDetailPanel({
  conversation,
  showStandaloneLink = false
}: {
  conversation: ConversationDetail;
  showStandaloneLink?: boolean;
}) {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel card stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="app-sidebar-label">Contact</span>
            <strong style={{ fontSize: 24 }}>{conversation.contact.displayName}</strong>
            <span style={{ color: "var(--muted)" }}>
              external user id: {conversation.contact.externalUserId}
            </span>
          </div>
          <div className="stack" style={{ gap: 10, justifyItems: "end" }}>
            <div className="badge">Status: {conversation.status}</div>
            <ResumeBotButton conversationId={conversation.id} status={conversation.status} />
            {showStandaloneLink ? (
              <Link href={`/conversations/${conversation.id}`} className="button button-secondary">
                Open Full View
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      <div className="conversation-detail-grid">
        <div className="panel card stack">
          <span className="app-sidebar-label">Timeline</span>
          <strong>Messages</strong>
          {conversation.messages.length === 0 ? (
            <span style={{ color: "var(--muted)" }}>尚無訊息。</span>
          ) : (
            conversation.messages.map((message) => (
              <div key={message.id} className="panel card stack" style={{ gap: 6 }}>
                <strong>
                  {message.role} / {message.source}
                </strong>
                <span>{message.content}</span>
                <span style={{ color: "var(--muted)", fontSize: 14 }}>{message.createdAt}</span>
              </div>
            ))
          )}
        </div>
        <div className="stack">
          <div className="panel card stack">
            <span className="app-sidebar-label">Operational State</span>
            <strong>Conversation Status</strong>
            <span>Opened At: {conversation.openedAt}</span>
            <span>Last Message At: {conversation.lastMessageAt ?? "-"}</span>
            <span>Scenario ID: {conversation.scenarioId ?? "-"}</span>
          </div>
          <div className="panel card stack">
            <span className="app-sidebar-label">Human Handoff</span>
            <strong>Escalation Details</strong>
            <span>Handoff Requested At: {conversation.handoffRequestedAt ?? "-"}</span>
            <span>Human Activated At: {conversation.humanActivatedAt ?? "-"}</span>
            <span style={{ color: "var(--muted)", fontSize: 14 }}>
              `human_active` 代表 bot 已停止回覆，商家需從 LINE OA 原生後台接手。
            </span>
          </div>
          <div className="panel card stack">
            <span className="app-sidebar-label">System Details</span>
            <strong>Debug Reference</strong>
            <span>Conversation ID: {conversation.id}</span>
            <span>Contact ID: {conversation.contact.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
