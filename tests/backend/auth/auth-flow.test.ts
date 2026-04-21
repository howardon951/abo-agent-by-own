import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePostSignInPath,
  resolvePostSignUpFlow,
  type SignInTenantMembershipRepository
} from "@/lib/auth/auth-flow";

function createRepository(
  overrides: Partial<SignInTenantMembershipRepository> = {}
) {
  const calls: string[] = [];

  const repository: SignInTenantMembershipRepository = {
    async findTenantMembership(userId) {
      calls.push(`findTenantMembership:${userId}`);
      return null;
    },
    ...overrides
  };

  return { repository, calls };
}

test("routes signed-in users with a tenant to the dashboard", async () => {
  const { repository, calls } = createRepository({
    async findTenantMembership(userId) {
      calls.push(`findTenantMembership:${userId}`);
      return { tenantId: "tenant-1" };
    }
  });

  const path = await resolvePostSignInPath("user-1", repository);

  assert.equal(path, "/dashboard");
  assert.deepEqual(calls, ["findTenantMembership:user-1"]);
});

test("routes signed-in users without a tenant to setup", async () => {
  const { repository, calls } = createRepository();

  const path = await resolvePostSignInPath("user-setup", repository);

  assert.equal(path, "/setup");
  assert.deepEqual(calls, ["findTenantMembership:user-setup"]);
});

test("keeps verified signups in the setup flow", () => {
  assert.deepEqual(resolvePostSignUpFlow(true), {
    redirectPath: "/setup",
    message: null
  });
});

test("sends unverified signups back to login with the confirmation message", () => {
  assert.deepEqual(resolvePostSignUpFlow(false), {
    redirectPath: "/login",
    message: "註冊成功，請先至信箱完成驗證後登入"
  });
});
