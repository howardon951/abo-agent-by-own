import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table";

export default function KnowledgePage() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Knowledge Base" description="管理 FAQ / PDF / URL 文件。">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/knowledge/new" className="button button-primary">
            Add document
          </Link>
        </div>
      </PageSection>
      <DataTable
        columns={[
          { key: "title", label: "Title" },
          { key: "sourceType", label: "Type" },
          { key: "status", label: "Status" },
          { key: "updatedAt", label: "Updated" }
        ]}
        rows={[
          { title: "常見問題", sourceType: "FAQ", status: "Ready", updatedAt: "12:00" },
          { title: "門市資訊頁", sourceType: "URL", status: "Ready", updatedAt: "12:05" },
          { title: "產品手冊.pdf", sourceType: "PDF", status: "Processing", updatedAt: "-" }
        ]}
      />
    </div>
  );
}
