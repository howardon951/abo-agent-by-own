import test from "node:test";
import assert from "node:assert/strict";
import {
  setupTenant,
  type SetupTenantInput,
  type SetupTenantRepository
} from "@/server/domain/tenant/setup-tenant";

function createRepository(overrides: Partial<SetupTenantRepository> = {}) {
  const calls: string[] = [];

  const repository: SetupTenantRepository = {
    async findMembershipByUserId(userId) {
      calls.push(`findMembershipByUserId:${userId}`);
      return null;
    },
    async findTenantById(tenantId) {
      calls.push(`findTenantById:${tenantId}`);
      return {
        id: tenantId,
        name: "Existing Tenant",
        slug: "existing-tenant",
        status: "active"
      };
    },
    async createTenant(input) {
      calls.push(`createTenant:${input.slug}`);
      return {
        id: "tenant-new",
        name: input.tenantName,
        slug: input.slug,
        status: "active"
      };
    },
    async createTenantMember(input) {
      calls.push(`createTenantMember:${input.tenantId}:${input.userId}:${input.role}`);
    },
    async createAgent(input) {
      calls.push(`createAgent:${input.tenantId}`);
      return { id: "agent-new" };
    },
    async createKnowledgeBase(input) {
      calls.push(`createKnowledgeBase:${input.tenantId}`);
    },
    async createScenarios(input) {
      calls.push(`createScenarios:${input.agentId}`);
    },
    async createHandoffRule(input) {
      calls.push(`createHandoffRule:${input.agentId}`);
    },
    async deleteTenant(tenantId) {
      calls.push(`deleteTenant:${tenantId}`);
    },
    ...overrides
  };

  return { repository, calls };
}

const input: SetupTenantInput = {
  userId: "user-1",
  tenantName: "Abo Coffee",
  slug: "abo-coffee"
};

test("returns existing tenant without bootstrapping when membership already exists", async () => {
  const { repository, calls } = createRepository({
    async findMembershipByUserId(userId) {
      calls.push(`findMembershipByUserId:${userId}`);
      return { tenantId: "tenant-existing" };
    }
  });

  const result = await setupTenant(input, repository);

  assert.deepEqual(result, {
    tenant: {
      id: "tenant-existing",
      name: "Existing Tenant",
      slug: "existing-tenant",
      status: "active"
    },
    created: false
  });

  assert.deepEqual(calls, [
    "findMembershipByUserId:user-1",
    "findTenantById:tenant-existing"
  ]);
});

test("creates tenant and all bootstrap resources for first-time owner", async () => {
  const { repository, calls } = createRepository();

  const result = await setupTenant(input, repository);

  assert.deepEqual(result, {
    tenant: {
      id: "tenant-new",
      name: "Abo Coffee",
      slug: "abo-coffee",
      status: "active"
    },
    created: true
  });

  assert.deepEqual(calls, [
    "findMembershipByUserId:user-1",
    "createTenant:abo-coffee",
    "createTenantMember:tenant-new:user-1:owner",
    "createAgent:tenant-new",
    "createKnowledgeBase:tenant-new",
    "createScenarios:agent-new",
    "createHandoffRule:agent-new"
  ]);
});

test("deletes tenant when bootstrap fails after tenant creation", async () => {
  const { repository, calls } = createRepository({
    async createAgent(input) {
      calls.push(`createAgent:${input.tenantId}`);
      throw new Error("agent insert failed");
    }
  });

  await assert.rejects(() => setupTenant(input, repository), {
    message: "agent insert failed"
  });

  assert.deepEqual(calls, [
    "findMembershipByUserId:user-1",
    "createTenant:abo-coffee",
    "createTenantMember:tenant-new:user-1:owner",
    "createAgent:tenant-new",
    "deleteTenant:tenant-new"
  ]);
});
