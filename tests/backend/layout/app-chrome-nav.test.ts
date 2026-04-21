import test from "node:test";
import assert from "node:assert/strict";
import type { SessionUser } from "@/lib/auth/session";
import {
  buildAppChromeNav,
  getAppChromeRoleLabel
} from "@/components/layout/app-chrome-nav";

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

test("shows login/signup nav for signed-out visitors", () => {
  assert.deepEqual(buildAppChromeNav(null), [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/login", label: "Login" },
    { href: "/signup", label: "Signup" }
  ]);
});

test("routes signed-in tenant owner to merchant dashboard nav", () => {
  assert.deepEqual(buildAppChromeNav(tenantOwner), [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/agent", label: "Agent" },
    { href: "/scenarios", label: "Scenarios" },
    { href: "/knowledge", label: "Knowledge" },
    { href: "/conversations", label: "Conversations" },
    { href: "/line", label: "LINE" },
    { href: "/playground", label: "Playground" },
    { href: "/pricing", label: "Pricing" }
  ]);
});

test("routes setup-pending users to setup nav instead of merchant dashboard", () => {
  assert.deepEqual(buildAppChromeNav(setupPendingOwner), [
    { href: "/", label: "Home" },
    { href: "/setup", label: "Setup" },
    { href: "/pricing", label: "Pricing" }
  ]);
});

test("adds platform nav entry only for platform admins", () => {
  assert.deepEqual(buildAppChromeNav(platformAdmin), [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/agent", label: "Agent" },
    { href: "/scenarios", label: "Scenarios" },
    { href: "/knowledge", label: "Knowledge" },
    { href: "/conversations", label: "Conversations" },
    { href: "/line", label: "LINE" },
    { href: "/playground", label: "Playground" },
    { href: "/platform", label: "Platform" },
    { href: "/pricing", label: "Pricing" }
  ]);
});

test("formats the session role label for each authenticated user state", () => {
  assert.equal(getAppChromeRoleLabel(platformAdmin), "platform admin");
  assert.equal(getAppChromeRoleLabel(tenantOwner), "merchant owner");
  assert.equal(getAppChromeRoleLabel(setupPendingOwner), "setup pending");
});
