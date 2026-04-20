import { mockTenant } from "@/server/domain/mock-data";

export async function setupTenant(input: { tenantName: string; slug: string }) {
  return {
    tenant: {
      ...mockTenant,
      name: input.tenantName,
      slug: input.slug
    }
  };
}
