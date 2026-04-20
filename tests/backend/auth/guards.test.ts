import test from "node:test";
import assert from "node:assert/strict";
import type { SessionUser } from "@/lib/auth/session";
import {
  AuthError,
  ensureTenantScopedUser,
  ensurePlatformAdminUser,
  ensureTenantOwnerUser,
  getTenantRedirectPath,
  isTenantOwner
} from "@/lib/auth/guards";

const tenantOwner: SessionUser = {
  id: "user-tenant",
  email: "owner@example.com",
  role: "tenant_owner",
  tenantId: "tenant-1"
};

const setupPendingOwner: SessionUser = {
  id: "user-setup",
  email: "setup@example.com",
  role: "tenant_owner"
};

const platformAdmin: SessionUser = {
  id: "user-admin",
  email: "admin@example.com",
  role: "platform_admin",
  tenantId: "tenant-ops"
};

test("treats tenant owners and platform admins as tenant-access users", () => {
  assert.equal(isTenantOwner(tenantOwner), true);
  assert.equal(isTenantOwner(platformAdmin), true);
  assert.equal(isTenantOwner(null), false);
});

test("maps tenant redirect path to setup or dashboard based on tenant membership", () => {
  assert.equal(getTenantRedirectPath(setupPendingOwner), "/setup");
  assert.equal(getTenantRedirectPath(tenantOwner), "/dashboard");
});

test("allows tenant owner guard for tenant owner and platform admin users", () => {
  assert.equal(ensureTenantOwnerUser(tenantOwner), tenantOwner);
  assert.equal(ensureTenantOwnerUser(platformAdmin), platformAdmin);
});

test("requires tenant context for merchant-scoped access", () => {
  assert.equal(ensureTenantScopedUser(tenantOwner), tenantOwner);
  assert.equal(ensureTenantScopedUser(platformAdmin), platformAdmin);

  assert.throws(() => ensureTenantScopedUser(setupPendingOwner), (error) => {
    assert.ok(error instanceof AuthError);
    assert.equal(error.code, "FORBIDDEN");
    assert.equal(error.status, 403);
    assert.equal(error.message, "tenant context required");
    return true;
  });
});

test("rejects tenant owner guard when session is missing", () => {
  assert.throws(() => ensureTenantOwnerUser(null), (error) => {
    assert.ok(error instanceof AuthError);
    assert.equal(error.code, "UNAUTHORIZED");
    assert.equal(error.status, 401);
    return true;
  });
});

test("rejects platform admin guard for non-admin users", () => {
  assert.throws(() => ensurePlatformAdminUser(tenantOwner), (error) => {
    assert.ok(error instanceof AuthError);
    assert.equal(error.code, "FORBIDDEN");
    assert.equal(error.status, 403);
    return true;
  });
});

test("allows platform admin guard only for platform admins", () => {
  assert.equal(ensurePlatformAdminUser(platformAdmin), platformAdmin);
});
