import { PageSection } from "@/components/layout/page-section";
import { AgentSettingsForm } from "@/components/merchant/agent-settings-form";

export default function AgentPage() {
  return (
    <PageSection title="Agent Settings" description="以表單設定品牌規則與 fallback。">
      <AgentSettingsForm />
    </PageSection>
  );
}
