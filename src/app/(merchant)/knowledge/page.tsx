import { PageSection } from "@/components/layout/page-section";
import { KnowledgeDocumentsManager } from "@/components/merchant/knowledge-documents-manager";
import { MerchantPageHero } from "@/components/merchant/merchant-page-hero";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { listKnowledgeDocuments } from "@/server/domain/knowledge/list-documents";

export default async function KnowledgePage() {
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

  const documents = await listKnowledgeDocuments();
  const readyCount = documents.documents.filter((document) => document.processingStatus === "ready").length;
  const processingCount = documents.documents.filter(
    (document) => document.processingStatus === "processing" || document.processingStatus === "queued"
  ).length;

  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Knowledge Base" description="管理 FAQ / PDF / URL 文件。">
        <MerchantPageHero
          eyebrow="Launch"
          title="Turn merchant knowledge into replyable context"
          description="這頁負責整理 FAQ、網址與文件，讓 bot 至少有可引用的基礎內容，而不是只靠空白 prompt 或硬編碼回覆。"
          businessQuestion="商家最需要先知道：這個 bot 回答問題時，到底有沒有可依據的知識來源？"
          actions={[
            { href: "/knowledge/new", label: "Add Document" },
            { href: "/playground", label: "Test Retrieval", variant: "secondary" }
          ]}
          stats={[
            {
              label: "Documents",
              value: String(documents.documents.length),
              hint: "目前已建立的 FAQ / PDF / URL 文件數"
            },
            {
              label: "Ready",
              value: String(readyCount),
              hint: "已標成 ready 的文件"
            },
            {
              label: "Processing",
              value: String(processingCount),
              hint: "queued / processing 狀態中的文件"
            }
          ]}
        />
        <KnowledgeDocumentsManager />
      </PageSection>
    </div>
  );
}
