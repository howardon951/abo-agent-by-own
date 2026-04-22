import { requireAdminClient } from "@/lib/supabase/admin";
import { pickDefined } from "@/lib/utils/object";

export type CurrentAgent = {
  id: string;
  name: string;
  brandName: string;
  brandTone: string | null;
  forbiddenTopics: string[];
  fallbackPolicy: string | null;
};

export type UpdateCurrentAgentInput = {
  name?: string;
  brandName?: string;
  brandTone?: string;
  forbiddenTopics?: string[];
  fallbackPolicy?: string;
};

export type CurrentAgentRepository = {
  getCurrentAgent(tenantId: string): Promise<CurrentAgent>;
  updateCurrentAgent(tenantId: string, input: UpdateCurrentAgentInput): Promise<CurrentAgent>;
};

export async function getCurrentAgent(
  tenantId: string,
  repository: CurrentAgentRepository = createRepository()
) {
  return repository.getCurrentAgent(tenantId);
}

export async function updateCurrentAgent(
  tenantId: string,
  input: UpdateCurrentAgentInput,
  repository: CurrentAgentRepository = createRepository()
) {
  return repository.updateCurrentAgent(tenantId, input);
}

function createRepository(): CurrentAgentRepository {
  const admin = requireAdminClient();
  const columns = "id, name, brand_name, brand_tone, forbidden_topics, fallback_policy";

  return {
    async getCurrentAgent(tenantId) {
      const { data, error } = await admin
        .from("agents")
        .select(columns)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

      if (error) {
        throw error;
      }

      return mapRow(data);
    },

    async updateCurrentAgent(tenantId, input) {
      const updates = pickDefined({
        name: input.name,
        brand_name: input.brandName,
        brand_tone: input.brandTone,
        forbidden_topics: input.forbiddenTopics,
        fallback_policy: input.fallbackPolicy
      });

      if (Object.keys(updates).length === 0) {
        return this.getCurrentAgent(tenantId);
      }

      const { data, error } = await admin
        .from("agents")
        .update(updates)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .select(columns)
        .single();

      if (error) {
        throw error;
      }

      return mapRow(data);
    }
  };
}

function mapRow(row: {
  id: string;
  name: string;
  brand_name: string;
  brand_tone: string | null;
  forbidden_topics: string[] | null;
  fallback_policy: string | null;
}): CurrentAgent {
  return {
    id: row.id,
    name: row.name,
    brandName: row.brand_name,
    brandTone: row.brand_tone,
    forbiddenTopics: row.forbidden_topics ?? [],
    fallbackPolicy: row.fallback_policy
  };
}
