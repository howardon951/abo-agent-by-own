import { PageSection } from "@/components/layout/page-section";

export default function NewKnowledgeDocumentPage() {
  return (
    <PageSection title="Add Document" description="MVP 支援 FAQ、PDF 與單頁 URL。">
      <div className="panel card stack">
        <div className="field">
          <label htmlFor="source-type">Source Type</label>
          <select id="source-type" defaultValue="faq">
            <option value="faq">FAQ</option>
            <option value="pdf">PDF</option>
            <option value="url">URL</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" placeholder="門市資訊頁" />
        </div>
        <div className="field">
          <label htmlFor="content">Content / URL</label>
          <textarea id="content" placeholder="輸入 FAQ 內容或 URL" />
        </div>
        <button className="button button-primary" type="button">
          Queue processing
        </button>
      </div>
    </PageSection>
  );
}
