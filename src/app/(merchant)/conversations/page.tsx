import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table";

export default function ConversationsPage() {
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
            <tr>
              <td>LINE User A</td>
              <td>bot_active</td>
              <td>今天營業到幾點？</td>
              <td>
                <Link href="/conversations/conv-1" className="button button-secondary">
                  View
                </Link>
              </td>
            </tr>
            <tr>
              <td>LINE User B</td>
              <td>human_active</td>
              <td>我要退貨</td>
              <td>
                <Link href="/conversations/conv-2" className="button button-secondary">
                  View
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
