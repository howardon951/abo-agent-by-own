import { requireAdminClient } from "@/lib/supabase/admin";
import { pickDefined } from "@/lib/utils/object";

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
  repository: ScenarioRepository = createRepository()
) {
  return repository.listScenarios(tenantId);
}

export async function updateScenario(
  tenantId: string,
  scenarioId: string,
  input: UpdateScenarioInput,
  repository: ScenarioRepository = createRepository()
) {
  return repository.updateScenario(tenantId, scenarioId, input);
}

function createRepository(): ScenarioRepository {
  const admin = requireAdminClient();
  const columns = "id, scenario_type, name, routing_keywords, prompt_config, is_enabled, sort_order";

  return {
    async listScenarios(tenantId) {
      const agentId = await getActiveAgentId(admin, tenantId);
      const { data, error } = await admin
        .from("agent_scenarios")
        .select(columns)
        .eq("tenant_id", tenantId)
        .eq("agent_id", agentId)
        .order("sort_order", { ascending: true });

      if (error) {
        throw error;
      }

      return data.map(mapRow);
    },

    async updateScenario(tenantId, scenarioId, input) {
      const agentId = await getActiveAgentId(admin, tenantId);
      const updates = pickDefined({
        name: input.name,
        routing_keywords: input.routingKeywords,
        prompt_config: input.promptConfig,
        is_enabled: input.isEnabled
      });

      if (Object.keys(updates).length === 0) {
        const { data, error } = await admin
          .from("agent_scenarios")
          .select(columns)
          .eq("tenant_id", tenantId)
          .eq("agent_id", agentId)
          .eq("id", scenarioId)
          .single();

        if (error) {
          throw error;
        }

        return mapRow(data);
      }

      const { data, error } = await admin
        .from("agent_scenarios")
        .update(updates)
        .eq("tenant_id", tenantId)
        .eq("agent_id", agentId)
        .eq("id", scenarioId)
        .select(columns)
        .single();

      if (error) {
        throw error;
      }

      return mapRow(data);
    }
  };
}

async function getActiveAgentId(
  admin: ReturnType<typeof requireAdminClient>,
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

function mapRow(row: {
  id: string;
  scenario_type: string;
  name: string;
  routing_keywords: string[] | null;
  prompt_config: Record<string, unknown> | null;
  is_enabled: boolean;
}): AgentScenario {
  return {
    id: row.id,
    scenarioType: row.scenario_type,
    name: row.name,
    routingKeywords: row.routing_keywords ?? [],
    promptConfig: row.prompt_config ?? {},
    isEnabled: row.is_enabled
  };
}
