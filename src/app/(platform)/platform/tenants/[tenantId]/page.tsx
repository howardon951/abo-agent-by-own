import { PageSection } from "@/components/layout/page-section";
import { getPlatformTenant } from "@/server/domain/tenant/platform-tenants";

export default async function PlatformTenantDetailPage({
  params
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const tenant = await getPlatformTenant(tenantId);

  return (
    <PageSection title="Tenant Detail" description={`Platform view for ${tenant.name}`}>
      <div className="grid-2">
        <div className="panel card stack">
          <strong>{tenant.name}</strong>
          <span>Plan: {tenant.plan}</span>
          <span>Status: {tenant.status}</span>
          <span>LINE: {tenant.lineStatus}</span>
        </div>
        <div className="panel card stack">
          <strong>Ops</strong>
          <span>Last activity: {tenant.lastActivityAt ?? "-"}</span>
          <span>Error count: {tenant.errors}</span>
        </div>
      </div>
    </PageSection>
  );
}
