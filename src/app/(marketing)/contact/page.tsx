import { PageSection } from "@/components/layout/page-section";

export default function ContactPage() {
  return (
    <PageSection
      title="Contact"
      description="這裡之後可接表單或 Calendly。MVP 先保留靜態頁。"
    >
      <div className="panel card">
        <p style={{ margin: 0 }}>
          若你是代理商或商家，想試用 Managed 方案，之後可在此接洽詢流程。
        </p>
      </div>
    </PageSection>
  );
}
