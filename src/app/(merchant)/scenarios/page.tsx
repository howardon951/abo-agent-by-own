import { PageSection } from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table";

export default function ScenariosPage() {
  return (
    <PageSection title="Scenarios" description="MVP 採規則式路由。">
      <DataTable
        columns={[
          { key: "name", label: "Scenario" },
          { key: "keywords", label: "Routing Keywords" },
          { key: "status", label: "Status" }
        ]}
        rows={[
          { name: "一般 FAQ", keywords: "-", status: "Enabled" },
          { name: "售前問答", keywords: "價格, 費用, 方案", status: "Enabled" },
          { name: "門市資訊", keywords: "地址, 營業時間, 停車", status: "Enabled" }
        ]}
      />
    </PageSection>
  );
}
