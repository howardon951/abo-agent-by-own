import { PageSection } from "@/components/layout/page-section";
import { StatCard } from "@/components/ui/stat-card";

export default function PlatformPage() {
  return (
    <div className="stack" style={{ gap: 24 }}>
      <PageSection title="Platform Dashboard" description="平台方跨租戶總覽。">
        <div className="grid-3">
          <StatCard label="Tenants" value="2" hint="MVP seed data" />
          <StatCard label="Errors Today" value="2" hint="看 logs page" />
          <StatCard label="Estimated Cost" value="$2.79" hint="usage aggregation" />
        </div>
      </PageSection>
    </div>
  );
}
