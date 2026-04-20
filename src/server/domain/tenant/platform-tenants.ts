import { mockConversations, mockTenant } from "@/server/domain/mock-data";

export async function listPlatformTenants() {
  return [
    {
      ...mockTenant,
      plan: "Basic",
      lineStatus: "Connected",
      lastActivityAt: mockConversations[0]?.lastMessageAt ?? null,
      errors: 0
    },
    {
      id: "tenant-demo-salon",
      name: "Demo Salon",
      slug: "demo-salon",
      status: "active",
      plan: "Pro",
      lineStatus: "Error",
      lastActivityAt: "2026-04-01T12:50:00Z",
      errors: 2
    }
  ];
}

export async function getPlatformTenant(tenantId: string) {
  const tenants = await listPlatformTenants();
  return tenants.find((tenant) => tenant.id === tenantId) ?? tenants[0];
}
