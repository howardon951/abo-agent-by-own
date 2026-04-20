import { getConversation } from "@/server/domain/conversation/get-conversation";
import { PageSection } from "@/components/layout/page-section";

export default async function ConversationDetailPage({
  params
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const data = await getConversation(conversationId);

  return (
    <PageSection title="Conversation Detail" description={`Conversation ${conversationId}`}>
      <div className="grid-2">
        <div className="panel card stack">
          <div className="badge">Status: {data.conversation.status}</div>
          {data.conversation.messages.map((message) => (
            <div key={message.id} className="panel card stack" style={{ gap: 6 }}>
              <strong>{message.role}</strong>
              <span>{message.content}</span>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{message.createdAt}</span>
            </div>
          ))}
        </div>
        <div className="panel card stack">
          <strong>Debug</strong>
          <span>Contact: {data.conversation.contact.displayName}</span>
          <span>Scenario: post_sales</span>
          <span>Last LLM call: skipped while human_active</span>
        </div>
      </div>
    </PageSection>
  );
}
