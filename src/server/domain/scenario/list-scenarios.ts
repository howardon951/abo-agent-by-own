import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AgentScenario = {
  id: string;
  scenarioType: string;
  name: string;
  routingKeywords: string[];
  promptConfig: Record<string, unknown>;
  isEnabled: boolean;
};

export type UpdateScenarioInput = {
  name?: string;
  routingKeywords?: string[];
  promptConfig?: Record<string, unknown>;
  isEnabled?: boolean;
};

export type ScenarioRepository = {
  listScenarios(tenantId: string): Promise<AgentScenario[]>;
  updateScenario(
    tenantId: string,
    scenarioId: string,
    input: UpdateScenarioInput
  ): Promise<AgentScenario>;
};

export async function listScenarios(
  tenantId: string,
  repository: ScenarioRepository = createSupabaseScenarioRepository()
) {
  return { scenarios: await repository.listScenarios(tenantId) };
}

export async function updateScenario(
  tenantId: string,
  scenarioId: string,
  input: UpdateScenarioInput,
  repository: ScenarioRepository = createSupabaseScenarioRepository()
) {
  return { scenario: await repository.updateScenario(tenantId, scenarioId, input) };
}

export function createSupabaseScenarioRepository(): ScenarioRepository {
  const admin = createAdminSupabaseClient();
  if (!admin) {
    throw new Error("Supabase secret key is not configured");
  }

  const selectColumns =
    "id, scenario_type, name, routing_keywords, prompt_config, is_enabled, sort_order";

  return {
    async listScenarios(tenantId) {
      const agentId = await getActiveAgentId(admin, tenantId);
      const { data, error } = await admin
        .from("agent_scenarios")
        .select(selectColumns)
        .eq("tenant_id", tenantId)
        .eq("agent_id", agentId)
        .order("sort_order", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(mapScenarioRow);
    },

    async updateScenario(tenantId, scenarioId, input) {
      const agentId = await getActiveAgentId(admin, tenantId);
      const updates = toScenarioUpdateRow(input);
      if (Object.keys(updates).length === 0) {
        const { data, error } = await admin
          .from("agent_scenarios")
          .select(selectColumns)
          .eq("tenant_id", tenantId)
          .eq("agent_id", agentId)
          .eq("id", scenarioId)
          .single();

        if (error) {
          throw error;
        }

        return mapScenarioRow(data);
      }

      const { data, error } = await admin
        .from("agent_scenarios")
        .update(updates)
        .eq("tenant_id", tenantId)
        .eq("agent_id", agentId)
        .eq("id", scenarioId)
        .select(selectColumns)
        .single();

      if (error) {
        throw error;
      }

      return mapScenarioRow(data);
    }
  };
}

async function getActiveAgentId(
  admin: NonNullable<ReturnType<typeof createAdminSupabaseClient>>,
  tenantId: string
) {
  const { data, error } = await admin
    .from("agents")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("status", "active")
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

function toScenarioUpdateRow(input: UpdateScenarioInput) {
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.routingKeywords !== undefined) {
    updates.routing_keywords = input.routingKeywords;
  }

  if (input.promptConfig !== undefined) {
    updates.prompt_config = input.promptConfig;
  }

  if (input.isEnabled !== undefined) {
    updates.is_enabled = input.isEnabled;
  }

  return updates;
}

function mapScenarioRow(row: {
  id: string;
  scenario_type: string;
  name: string;
  routing_keywords: string[] | null;
  prompt_config: Record<string, unknown> | null;
  is_enabled: boolean;
}) {
  return {
    id: row.id,
    scenarioType: row.scenario_type,
    name: row.name,
    routingKeywords: row.routing_keywords ?? [],
    promptConfig: row.prompt_config ?? {},
    isEnabled: row.is_enabled
  };
}
