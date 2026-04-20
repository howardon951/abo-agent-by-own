import test from "node:test";
import assert from "node:assert/strict";
import { AuthError, type TenantScopedUser } from "@/lib/auth/guards";
import { ok } from "@/server/dto/api-response";
import { runTenantScopedRoute } from "@/server/http/tenant-route";

const tenantUser: TenantScopedUser = {
  id: "user-tenant",
  email: "owner@example.com",
  role: "tenant_owner",
  tenantId: "tenant-1"
};

test("runs the handler with the authenticated tenant-scoped user", async () => {
  let receivedUser: TenantScopedUser | null = null;

  const response = await runTenantScopedRoute(
    async (user) => {
      receivedUser = user;
      return ok({ tenantId: user.tenantId });
    },
    async () => tenantUser
  );

  assert.equal(receivedUser, tenantUser);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    data: { tenantId: "tenant-1" },
    error: null
  });
});

test("maps auth errors into API failure responses", async () => {
  const response = await runTenantScopedRoute(
    async () => ok({ ok: true }),
    async () => {
      throw new AuthError("FORBIDDEN", "tenant context required", 403);
    }
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), {
    data: null,
    error: {
      code: "FORBIDDEN",
      message: "tenant context required"
    }
  });
});

test("rethrows unexpected errors from auth resolution", async () => {
  await assert.rejects(
    () =>
      runTenantScopedRoute(
        async () => ok({ ok: true }),
        async () => {
          throw new Error("boom");
        }
      ),
    { message: "boom" }
  );
});
