import { PageSection } from "@/components/layout/page-section";
import { DataTable } from "@/components/ui/data-table";

export default function PlatformUsagePage() {
  return (
    <PageSection title="Platform Usage" description="平台方查看訊息量與成本估算。">
      <DataTable
        columns={[
          { key: "tenant", label: "Tenant" },
          { key: "messages", label: "Messages" },
          { key: "tokens", label: "Tokens" },
          { key: "cost", label: "Est. Cost" }
        ]}
        rows={[
          { tenant: "Abo Coffee", messages: 42, tokens: 12000, cost: 0.82 },
          { tenant: "Demo Salon", messages: 88, tokens: 31000, cost: 1.97 }
        ]}
      />
    </PageSection>
  );
}
