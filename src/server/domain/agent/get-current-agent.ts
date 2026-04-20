import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
  repository: CurrentAgentRepository = createSupabaseCurrentAgentRepository()
) {
  return { agent: await repository.getCurrentAgent(tenantId) };
}

export async function updateCurrentAgent(
  tenantId: string,
  input: UpdateCurrentAgentInput,
  repository: CurrentAgentRepository = createSupabaseCurrentAgentRepository()
) {
  return { agent: await repository.updateCurrentAgent(tenantId, input) };
}

export function createSupabaseCurrentAgentRepository(): CurrentAgentRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  const selectColumns =
    "id, name, brand_name, brand_tone, forbidden_topics, fallback_policy";

  return {
    async getCurrentAgent(tenantId) {
      const { data, error } = await admin
        .from("agents")
        .select(selectColumns)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .single();

      if (error) {
        throw error;
      }

      return mapAgentRow(data);
    },

    async updateCurrentAgent(tenantId, input) {
      const updates = toAgentUpdateRow(input);
      if (Object.keys(updates).length === 0) {
        return this.getCurrentAgent(tenantId);
      }

      const { data, error } = await admin
        .from("agents")
        .update(updates)
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .select(selectColumns)
        .single();

      if (error) {
        throw error;
      }

      return mapAgentRow(data);
    }
  };
}

function toAgentUpdateRow(input: UpdateCurrentAgentInput) {
  const updates: Record<string, string | string[]> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.brandName !== undefined) {
    updates.brand_name = input.brandName;
  }

  if (input.brandTone !== undefined) {
    updates.brand_tone = input.brandTone;
  }

  if (input.forbiddenTopics !== undefined) {
    updates.forbidden_topics = input.forbiddenTopics;
  }

  if (input.fallbackPolicy !== undefined) {
    updates.fallback_policy = input.fallbackPolicy;
  }

  return updates;
}

function mapAgentRow(row: {
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
