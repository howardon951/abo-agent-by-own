import { requireAdminClient } from "@/lib/supabase/admin";

export type SetupTenantInput = {
  userId: string;
  tenantName: string;
  slug: string;
};

export type SetupTenantResult = {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  created: boolean;
};

export type SetupTenantRepository = {
  findMembershipByUserId(userId: string): Promise<{ tenantId: string } | null>;
  findTenantById(tenantId: string): Promise<SetupTenantResult["tenant"]>;
  createTenant(input: SetupTenantInput): Promise<SetupTenantResult["tenant"]>;
  createTenantMember(input: { tenantId: string; userId: string; role: "owner" }): Promise<void>;
  createAgent(input: {
    tenantId: string;
    tenantName: string;
  }): Promise<{ id: string }>;
  createKnowledgeBase(input: { tenantId: string; name: string; isDefault: boolean }): Promise<void>;
  createScenarios(input: { tenantId: string; agentId: string }): Promise<void>;
  createHandoffRule(input: { tenantId: string; agentId: string }): Promise<void>;
  deleteTenant(tenantId: string): Promise<void>;
};

export async function setupTenant(
  input: SetupTenantInput,
  repository: SetupTenantRepository = createSupabaseSetupTenantRepository()
): Promise<SetupTenantResult> {
  const existingMembership = await repository.findMembershipByUserId(input.userId);

  if (existingMembership?.tenantId) {
    const existingTenant = await repository.findTenantById(existingMembership.tenantId);
    return {
      tenant: existingTenant,
      created: false
    };
  }

  let tenantId: string | null = null;

  try {
    const tenant = await repository.createTenant(input);
    tenantId = tenant.id;

    await repository.createTenantMember({
      tenantId: tenant.id,
      userId: input.userId,
      role: "owner"
    });

    const agent = await repository.createAgent({
      tenantId: tenant.id,
      tenantName: input.tenantName
    });

    await repository.createKnowledgeBase({
      tenantId: tenant.id,
      name: "Default Knowledge Base",
      isDefault: true
    });

    await repository.createScenarios({
      tenantId: tenant.id,
      agentId: agent.id
    });

    await repository.createHandoffRule({
      tenantId: tenant.id,
      agentId: agent.id
    });

    return {
      tenant,
      created: true
    };
  } catch (error) {
    if (tenantId) {
      await repository.deleteTenant(tenantId);
    }

    throw error;
  }
}

export function createSupabaseSetupTenantRepository(): SetupTenantRepository {
  const admin = requireAdminClient();

  return {
    async findMembershipByUserId(userId) {
      const { data, error } = await admin
        .from("tenant_members")
        .select("tenant_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data?.tenant_id ? { tenantId: data.tenant_id } : null;
    },

    async findTenantById(tenantId) {
      const { data, error } = await admin
        .from("tenants")
        .select("id, name, slug, status")
        .eq("id", tenantId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async createTenant(input) {
      const { data, error } = await admin
        .from("tenants")
        .insert({
          name: input.tenantName,
          slug: input.slug,
          status: "active",
          owner_user_id: input.userId
        })
        .select("id, name, slug, status")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async createTenantMember(input) {
      const { error } = await admin.from("tenant_members").insert({
        tenant_id: input.tenantId,
        user_id: input.userId,
        role: input.role
      });

      if (error) {
        throw error;
      }
    },

    async createAgent(input) {
      const { data, error } = await admin
        .from("agents")
        .insert({
          tenant_id: input.tenantId,
          name: "Main Agent",
          status: "active",
          brand_name: input.tenantName,
          brand_tone: "親切、簡短、專業",
          fallback_policy: "若資料不足，請保守回答並請用戶稍候"
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      return data;
    },

    async createKnowledgeBase(input) {
      const { error } = await admin.from("knowledge_bases").insert({
        tenant_id: input.tenantId,
        name: input.name,
        is_default: input.isDefault
      });

      if (error) {
        throw error;
      }
    },

    async createScenarios(input) {
      const { error } = await admin.from("agent_scenarios").insert([
        {
          tenant_id: input.tenantId,
          agent_id: input.agentId,
          scenario_type: "general_faq",
          name: "一般 FAQ",
          routing_keywords: [],
          prompt_config: {
            objective: "回答一般常見問題"
          },
          sort_order: 100,
          is_enabled: true
        },
        {
          tenant_id: input.tenantId,
          agent_id: input.agentId,
          scenario_type: "pre_sales",
          name: "售前問答",
          routing_keywords: ["價格", "費用", "方案"],
          prompt_config: {
            objective: "回答售前問題"
          },
          sort_order: 200,
          is_enabled: true
        },
        {
          tenant_id: input.tenantId,
          agent_id: input.agentId,
          scenario_type: "post_sales",
          name: "售後問答",
          routing_keywords: ["退款", "退貨", "維修"],
          prompt_config: {
            objective: "回答售後問題"
          },
          sort_order: 300,
          is_enabled: true
        },
        {
          tenant_id: input.tenantId,
          agent_id: input.agentId,
          scenario_type: "store_info",
          name: "門市資訊",
          routing_keywords: ["地址", "營業時間", "停車"],
          prompt_config: {
            objective: "回答門市資訊"
          },
          sort_order: 400,
          is_enabled: true
        }
      ]);

      if (error) {
        throw error;
      }
    },

    async createHandoffRule(input) {
      const { error } = await admin.from("agent_handoff_rules").insert({
        tenant_id: input.tenantId,
        agent_id: input.agentId,
        rule_name: "Default Handoff",
        keywords: ["客服", "真人", "退貨", "退款", "投訴"],
        auto_reply_text: "已轉由真人協助，請稍候",
        is_enabled: true
      });

      if (error) {
        throw error;
      }
    },

    async deleteTenant(tenantId) {
      const { error } = await admin.from("tenants").delete().eq("id", tenantId);
      if (error) {
        throw error;
      }
    }
  };
}
