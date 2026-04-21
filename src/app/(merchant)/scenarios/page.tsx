import { PageSection } from "@/components/layout/page-section";
import { ScenariosManager } from "@/components/merchant/scenarios-manager";

export default function ScenariosPage() {
  return (
    <PageSection title="Scenarios" description="MVP 採規則式路由。">
      <ScenariosManager />
    </PageSection>
  );
}
