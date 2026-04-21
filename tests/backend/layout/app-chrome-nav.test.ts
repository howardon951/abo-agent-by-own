import test from "node:test";
import assert from "node:assert/strict";
import type { SessionUser } from "@/lib/auth/session";
import {
  buildAppChromeNav,
  buildAppChromeNavSections,
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
  assert.deepEqual(buildAppChromeNavSections(null), [
    {
      title: "Explore",
      items: [
        { href: "/", label: "Home" },
        { href: "/pricing", label: "Pricing" },
        { href: "/contact", label: "Contact" }
      ]
    },
    {
      title: "Account",
      items: [
        { href: "/login", label: "Login" },
        { href: "/signup", label: "Signup" }
      ]
    }
  ]);
});

test("routes signed-in tenant owner to merchant dashboard nav", () => {
  assert.deepEqual(buildAppChromeNavSections(tenantOwner), [
    {
      title: "Overview",
      items: [{ href: "/dashboard", label: "Overview" }]
    },
    {
      title: "Launch",
      items: [
        { href: "/line", label: "LINE Channel" },
        { href: "/knowledge", label: "Knowledge Base" }
      ]
    },
    {
      title: "Behavior",
      items: [
        { href: "/agent", label: "Agent Profile" },
        { href: "/scenarios", label: "Response Scenarios" }
      ]
    },
    {
      title: "Inbox",
      items: [{ href: "/conversations", label: "Conversations" }]
    },
    {
      title: "Tools",
      items: [{ href: "/playground", label: "Test Playground" }]
    },
    {
      title: "Admin",
      items: [{ href: "/settings", label: "Settings" }]
    }
  ]);
});

test("routes setup-pending users to setup nav instead of merchant dashboard", () => {
  assert.deepEqual(buildAppChromeNavSections(setupPendingOwner), [
    {
      title: "Get Started",
      items: [{ href: "/setup", label: "Workspace Setup" }]
    },
    {
      title: "Reference",
      items: [{ href: "/pricing", label: "Pricing" }]
    }
  ]);
});

test("adds platform nav entry only for platform admins", () => {
  const sections = buildAppChromeNavSections(platformAdmin);

  assert.equal(sections.at(-1)?.title, "Platform");
  assert.deepEqual(sections.at(-1)?.items, [{ href: "/platform", label: "Platform Console" }]);
});

test("keeps a flattened nav export for compatibility", () => {
  assert.deepEqual(
    buildAppChromeNav(tenantOwner).map((item) => item.label),
    [
      "Overview",
      "LINE Channel",
      "Knowledge Base",
      "Agent Profile",
      "Response Scenarios",
      "Conversations",
      "Test Playground",
      "Settings"
    ]
  );
});

test("formats the session role label for each authenticated user state", () => {
  assert.equal(getAppChromeRoleLabel(platformAdmin), "platform admin");
  assert.equal(getAppChromeRoleLabel(tenantOwner), "merchant owner");
  assert.equal(getAppChromeRoleLabel(setupPendingOwner), "setup pending");
});
