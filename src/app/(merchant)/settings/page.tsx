import { PageSection } from "@/components/layout/page-section";

export default function SettingsPage() {
  return (
    <PageSection title="Settings" description="保留商家層級設定頁。">
      <div className="panel card">
        <p style={{ margin: 0 }}>
          這裡之後可放 tenant profile、plan summary、token usage 與資料刪除設定。
        </p>
      </div>
    </PageSection>
  );
}
