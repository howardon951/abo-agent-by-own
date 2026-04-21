import { PageSection } from "@/components/layout/page-section";
import { NewKnowledgeDocumentForm } from "@/components/merchant/new-knowledge-document-form";

export default function NewKnowledgeDocumentPage() {
  return (
    <PageSection title="Add Document" description="MVP 支援 FAQ、PDF 與單頁 URL。">
      <NewKnowledgeDocumentForm />
    </PageSection>
  );
}
