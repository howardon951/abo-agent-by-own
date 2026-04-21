import { PageSection } from "@/components/layout/page-section";
import { KnowledgeDocumentsManager } from "@/components/merchant/knowledge-documents-manager";

export default function KnowledgePage() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Knowledge Base" description="管理 FAQ / PDF / URL 文件。">
        <KnowledgeDocumentsManager />
      </PageSection>
    </div>
  );
}
