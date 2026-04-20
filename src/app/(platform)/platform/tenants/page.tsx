import Link from "next/link";
import { PageSection } from "@/components/layout/page-section";

export default function PlatformTenantsPage() {
  return (
    <PageSection title="Tenants" description="平台方查看商家與方案狀態。">
      <div className="panel card">
        <table className="table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Plan</th>
              <th>Status</th>
              <th>LINE</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Abo Coffee</td>
              <td>Basic</td>
              <td>Active</td>
              <td>Connected</td>
              <td>
                <Link href="/platform/tenants/tenant-demo" className="button button-secondary">
                  View
                </Link>
              </td>
            </tr>
            <tr>
              <td>Demo Salon</td>
              <td>Pro</td>
              <td>Active</td>
              <td>Error</td>
              <td>
                <Link
                  href="/platform/tenants/tenant-demo-salon"
                  className="button button-secondary"
                >
                  View
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </PageSection>
  );
}
