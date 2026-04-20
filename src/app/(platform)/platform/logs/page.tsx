import { PageSection } from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table";

export default function PlatformLogsPage() {
  return (
    <PageSection title="Platform Logs" description="查看 message job 與文件處理錯誤。">
      <DataTable
        columns={[
          { key: "time", label: "Time" },
          { key: "tenant", label: "Tenant" },
          { key: "event", label: "Event" },
          { key: "detail", label: "Detail" }
        ]}
        rows={[
          {
            time: "13:02",
            tenant: "Abo Coffee",
            event: "message_job failed",
            detail: "LLM timeout"
          },
          {
            time: "12:45",
            tenant: "Demo Salon",
            event: "document failed",
            detail: "PDF parse failed"
          }
        ]}
      />
    </PageSection>
  );
}
