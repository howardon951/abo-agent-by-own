import { getConversation } from "@/server/domain/conversation/get-conversation";
import { PageSection } from "@/components/layout/page-section";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ResumeBotButton } from "@/components/merchant/resume-bot-button";

export default async function ConversationDetailPage({
  params
}: {
  params: Promise<{ conversationId: string }>;
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

  const { conversationId } = await params;
  const data = await getConversation(user.tenantId, conversationId);

  return (
    <PageSection title="Conversation Detail" description={`Conversation ${conversationId}`}>
      <div className="grid-2">
        <div className="panel card stack">
          <div className="badge">Status: {data.conversation.status}</div>
          {data.conversation.messages.length === 0 ? (
            <span style={{ color: "var(--muted)" }}>尚無訊息。</span>
          ) : (
            data.conversation.messages.map((message) => (
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
        <div className="panel card stack">
          <strong>Debug</strong>
          <span>Contact: {data.conversation.contact.displayName}</span>
          <span>External User ID: {data.conversation.contact.externalUserId}</span>
          <span>Opened At: {data.conversation.openedAt}</span>
          <span>Last Message At: {data.conversation.lastMessageAt ?? "-"}</span>
          <span>Scenario ID: {data.conversation.scenarioId ?? "-"}</span>
          <span>Handoff Requested At: {data.conversation.handoffRequestedAt ?? "-"}</span>
          <span>Human Activated At: {data.conversation.humanActivatedAt ?? "-"}</span>
          <ResumeBotButton
            conversationId={data.conversation.id}
            status={data.conversation.status}
          />
        </div>
      </div>
    </PageSection>
  );
}
