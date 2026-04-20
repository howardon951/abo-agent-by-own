import type { SessionUser } from "@/lib/auth/session";

export type AppChromeNavItem = {
  href: string;
  label: string;
};

export function buildAppChromeNav(user: SessionUser | null): AppChromeNavItem[] {
  return [
    { href: "/", label: "Home" },
    ...(user
      ? [
          {
            href: user.tenantId ? "/dashboard" : "/setup",
            label: user.tenantId ? "Merchant" : "Setup"
          },
          { href: "/playground", label: "Playground" }
        ]
      : []),
    ...(user?.role === "platform_admin" ? [{ href: "/platform", label: "Platform" }] : []),
    { href: "/pricing", label: "Pricing" },
    ...(!user
      ? [
          { href: "/login", label: "Login" },
          { href: "/signup", label: "Signup" }
        ]
      : [])
  ];
}

export function getAppChromeRoleLabel(user: SessionUser) {
  if (user.role === "platform_admin") {
    return "platform admin";
  }

  if (user.tenantId) {
    return "merchant owner";
  }

  return "setup pending";
}
