import { getConversation } from "@/server/domain/conversation/get-conversation";
import { PageSection } from "@/components/layout/page-section";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ConversationDetailPanel } from "@/components/merchant/conversation-detail-panel";

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
    <PageSection
      title="Conversation"
      description={`集中看這條對話目前是 bot_active 還是 human_active，再決定是否恢復 AI。`}
    >
      <ConversationDetailPanel conversation={data.conversation} />
    </PageSection>
  );
}
