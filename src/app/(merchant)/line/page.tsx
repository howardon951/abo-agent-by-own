import { PageSection } from "@/components/layout/page-section";
import { LineIntegrationForm } from "@/components/merchant/line-integration-form";

export default function LinePage() {
  return (
    <PageSection title="LINE Integration" description="設定 channel secret、token 與 webhook。">
      <LineIntegrationForm />
    </PageSection>
  );
}
