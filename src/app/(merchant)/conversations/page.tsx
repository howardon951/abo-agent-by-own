import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { getSessionUser } from "@/lib/auth/session";
import { listConversations } from "@/server/domain/conversation/list-conversations";
import { redirect } from "next/navigation";

export default async function ConversationsPage() {
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

  const data = await listConversations(user.tenantId);

  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Conversations" description="查看 bot_active 與 human_active 對話。">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          轉真人後，商家需從 LINE OA 原生後台接手，這裡只負責觀察與恢復 AI。
        </p>
      </PageSection>
      <div className="panel card">
        <table className="table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Status</th>
              <th>Last Message</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ color: "var(--muted)" }}>
                  尚無對話紀錄。
                </td>
              </tr>
            ) : (
              data.items.map((conversation) => (
                <tr key={conversation.id}>
                  <td>{conversation.contactDisplayName}</td>
                  <td>{conversation.status}</td>
                  <td>{conversation.lastMessageSnippet ?? "-"}</td>
                  <td>
                    <Link
                      href={`/conversations/${conversation.id}`}
                      className="button button-secondary"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
