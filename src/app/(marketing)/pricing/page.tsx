import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";

export default function PricingPage() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection
        title="Pricing"
        description="MVP 階段先用功能 tier 定價，計費自動化後補。"
      >
        <div className="grid-3">
          <StatCard label="Basic" value="1 Agent" hint="FAQ + PDF + handoff" />
          <StatCard label="Pro" value="Scenario+" hint="URL KB + Playground + more quota" />
          <StatCard label="Managed" value="Done-for-you" hint="平台代建與代管" />
        </div>
      </PageSection>
    </div>
  );
}
