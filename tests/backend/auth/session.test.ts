import test from "node:test";
import assert from "node:assert/strict";
import {
  resolveSessionUser,
  type SessionUserRepository
} from "@/lib/auth/session";

function createRepository(overrides: Partial<SessionUserRepository> = {}) {
  const calls: string[] = [];

  const repository: SessionUserRepository = {
    async isPlatformAdmin(userId) {
      calls.push(`isPlatformAdmin:${userId}`);
      return false;
    },
    async findTenantMembership(userId) {
      calls.push(`findTenantMembership:${userId}`);
      return null;
    },
    ...overrides
  };

  return { repository, calls };
}

test("resolves tenant owner with tenant membership", async () => {
  const { repository, calls } = createRepository({
    async findTenantMembership(userId) {
      calls.push(`findTenantMembership:${userId}`);
      return { tenantId: "tenant-1" };
    }
  });

  const user = await resolveSessionUser(
    { id: "user-1", email: "owner@example.com" },
    repository
  );

  assert.deepEqual(user, {
    id: "user-1",
    email: "owner@example.com",
    role: "tenant_owner",
    tenantId: "tenant-1"
  });

  assert.deepEqual(calls, [
    "isPlatformAdmin:user-1",
    "findTenantMembership:user-1"
  ]);
});

test("resolves tenant owner without tenant membership", async () => {
  const { repository } = createRepository();

  const user = await resolveSessionUser(
    { id: "user-2", email: "plain@example.com" },
    repository
  );

  assert.deepEqual(user, {
    id: "user-2",
    email: "plain@example.com",
    role: "tenant_owner",
    tenantId: undefined
  });
});

test("resolves platform admin and preserves tenant context", async () => {
  const { repository, calls } = createRepository({
    async isPlatformAdmin(userId) {
      calls.push(`isPlatformAdmin:${userId}`);
      return true;
    },
    async findTenantMembership(userId) {
      calls.push(`findTenantMembership:${userId}`);
      return { tenantId: "tenant-admin" };
    }
  });

  const user = await resolveSessionUser(
    { id: "user-admin", email: "admin@example.com" },
    repository
  );

  assert.deepEqual(user, {
    id: "user-admin",
    email: "admin@example.com",
    role: "platform_admin",
    tenantId: "tenant-admin"
  });

  assert.deepEqual(calls, [
    "isPlatformAdmin:user-admin",
    "findTenantMembership:user-admin"
  ]);
});
